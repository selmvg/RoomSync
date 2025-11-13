import express, { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

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
    const { description, amount, splitBetween } = req.body;

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
      select: { householdId: true },
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

    // Calculate share amount
    const totalAmount = parseFloat(amount);
    const shareAmount = totalAmount / splitBetween.length;

    // Create expense and shares in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create expense
      const expense = await tx.expense.create({
        data: {
          description,
          amount: totalAmount,
          householdId: user.householdId,
          paidById: userId,
        },
      });

      // Create expense shares
      const shares = await Promise.all(
        splitBetween.map((shareUserId: string) =>
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

      return expenseWithRelations;
    });

    res.status(201).json({ expense: result });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

