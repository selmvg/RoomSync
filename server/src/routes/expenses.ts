import express, { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createNotification } from '../lib/notifications';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/expenses
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Get all expenses for the household
    const expenses = await prisma.expense.findMany({
      where: { householdId: user.householdId },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
          },
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/expenses
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      description,
      amount,
      splitBetween,
      splitType,
      splitDetails,
      category,
      receiptUrl
    } = req.body;

    if (!description || !amount || !splitBetween) {
      return res.status(400).json({
        error: 'Description, amount, and splitBetween are required'
      });
    }

    if (!Array.isArray(splitBetween) || splitBetween.length === 0) {
      return res.status(400).json({
        error: 'splitBetween must be a non-empty array of user IDs'
      });
    }

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true, name: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Verify all users in splitBetween belong to the same household
    const splitUsers = await prisma.user.findMany({
      where: {
        id: { in: splitBetween },
      },
      select: {
        id: true,
        householdId: true,
      },
    });

    if (splitUsers.length !== splitBetween.length) {
      return res.status(400).json({ error: 'One or more user IDs are invalid' });
    }

    const invalidUsers = splitUsers.filter(u => u.householdId !== user.householdId);
    if (invalidUsers.length > 0) {
      return res.status(400).json({
        error: 'All users in splitBetween must belong to the same household'
      });
    }

    const totalAmount = parseFloat(amount);
    let shareAmounts: { userId: string; amount: number }[] = [];

    // Calculate share amounts based on split type
    if (splitType === 'exact' && splitDetails) {
      // splitDetails should be an object: { userId: amount, ... }
      const totalSpecified = Object.values(splitDetails as Record<string, number>).reduce(
        (sum: number, val: any) => sum + parseFloat(val),
        0
      );

      if (Math.abs(totalSpecified - totalAmount) > 0.01) {
        return res.status(400).json({
          error: `Exact split amounts (₱${totalSpecified.toFixed(2)}) must equal total amount (₱${totalAmount.toFixed(2)})`
        });
      }

      shareAmounts = splitBetween.map((userId: string) => ({
        userId,
        amount: parseFloat(splitDetails[userId] || '0'),
      }));
    } else if (splitType === 'percentage' && splitDetails) {
      // splitDetails should be an object: { userId: percentage, ... }
      const totalPercentage = Object.values(splitDetails as Record<string, number>).reduce(
        (sum: number, val: any) => sum + parseFloat(val),
        0
      );

      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({
          error: `Percentages must sum to 100% (currently ${totalPercentage.toFixed(2)}%)`
        });
      }

      shareAmounts = splitBetween.map((userId: string) => ({
        userId,
        amount: (totalAmount * parseFloat(splitDetails[userId] || '0')) / 100,
      }));
    } else {
      // Equal split (default)
      const shareAmount = totalAmount / splitBetween.length;
      shareAmounts = splitBetween.map((userId: string) => ({
        userId,
        amount: shareAmount,
      }));
    }

    // Create expense and shares in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create expense
      const expense = await tx.expense.create({
        data: {
          description,
          amount: totalAmount,
          category: category ? String(category) : undefined,
          receiptUrl: receiptUrl ? String(receiptUrl) : undefined,
          householdId: user.householdId!,
          paidById: userId,
        },
      });

      // Create expense shares
      const shares = await Promise.all(
        shareAmounts.map(({ userId: shareUserId, amount: shareAmount }) =>
          tx.expenseShare.create({
            data: {
              expenseId: expense.id,
              userId: shareUserId,
              amount: shareAmount,
            },
          })
        )
      );

      // Fetch the complete expense with relations
      const expenseWithRelations = await tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          paidBy: {
            select: {
              id: true,
              name: true,
            },
          },
          shares: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!expenseWithRelations) {
        throw new Error('Failed to retrieve created expense');
      }

      return expenseWithRelations;
    });

    // Create notification for other household members
    await createNotification({
      userId: userId,
      householdId: user.householdId,
      type: 'expense_added',
      message: `${user.name} added a new ₱${totalAmount.toFixed(2)} expense: ${description}`,
      relatedExpenseId: result.id,
    });

    res.status(201).json({ expense: result });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/expenses/:expenseId/shares/:shareId/settle
router.patch('/:expenseId/shares/:shareId/settle', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { expenseId, shareId } = req.params;
    const { isSettled } = req.body;

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Verify expense belongs to user's household
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.householdId !== user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify share belongs to expense
    const share = await prisma.expenseShare.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.expenseId !== expenseId) {
      return res.status(400).json({ error: 'Share does not belong to this expense' });
    }

    // Update share settlement status
    const updatedShare = await prisma.expenseShare.update({
      where: { id: shareId },
      data: {
        isSettled: isSettled !== undefined ? isSettled : !share.isSettled,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ share: updatedShare });
  } catch (error) {
    console.error('Settle share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

