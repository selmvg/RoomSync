import express, { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/households/me
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        household: {
          include: {
            members: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            chores: {
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            expenses: {
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
            },
          },
        },
      },
    });

    if (!user || !user.household) {
      return res.json({ household: null });
    }

    res.json({ household: user.household });
  } catch (error) {
    console.error('Get household error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/households
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Household name is required' });
    }

    // Check if user already has a household
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.householdId) {
      return res.status(400).json({ error: 'User already belongs to a household' });
    }

    // Create household and update user
    const household = await prisma.household.create({
      data: {
        name,
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({ household });
  } catch (error) {
    console.error('Create household error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/households/join
router.post('/join', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Check if user already has a household
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.householdId) {
      return res.status(400).json({ error: 'User already belongs to a household' });
    }

    // Find household by invite code
    const household = await prisma.household.findUnique({
      where: { inviteCode },
    });

    if (!household) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Add user to household
    const updatedHousehold = await prisma.household.update({
      where: { id: household.id },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.json({ household: updatedHousehold });
  } catch (error) {
    console.error('Join household error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/households/leave
router.post('/leave', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Check if user belongs to a household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Remove user from household and unassign from chores
    await prisma.$transaction(async (tx) => {
      // Unassign user from all chores
      await tx.chore.updateMany({
        where: {
          assignedToId: userId,
          householdId: user.householdId!,
        },
        data: {
          assignedToId: null,
        },
      });

      // Remove user from household
      await tx.user.update({
        where: { id: userId },
        data: {
          householdId: null,
        },
      });
    });

    res.json({ message: 'Successfully left household' });
  } catch (error) {
    console.error('Leave household error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

