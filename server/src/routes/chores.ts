import express, { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/chores
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

    // Get all chores for the household
    const chores = await prisma.chore.findMany({
      where: { householdId: user.householdId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ chores });
  } catch (error) {
    console.error('Get chores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chores
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, assignedToId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Chore title is required' });
    }

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Verify assignedToId belongs to the same household if provided
    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { householdId: true },
      });

      if (assignedUser?.householdId !== user.householdId) {
        return res.status(400).json({ error: 'Assigned user must belong to the same household' });
      }
    }

    // Create chore
    const chore = await prisma.chore.create({
      data: {
        title,
        householdId: user.householdId,
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({ chore });
  } catch (error) {
    console.error('Create chore error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/chores/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, isComplete, assignedToId } = req.body;

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Verify chore belongs to user's household
    const existingChore = await prisma.chore.findUnique({
      where: { id },
    });

    if (!existingChore) {
      return res.status(404).json({ error: 'Chore not found' });
    }

    if (existingChore.householdId !== user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify assignedToId belongs to the same household if provided
    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { householdId: true },
      });

      if (assignedUser?.householdId !== user.householdId) {
        return res.status(400).json({ error: 'Assigned user must belong to the same household' });
      }
    }

    // Update chore
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (isComplete !== undefined) updateData.isComplete = isComplete;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;

    const chore = await prisma.chore.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ chore });
  } catch (error) {
    console.error('Update chore error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/chores/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Verify chore belongs to user's household
    const existingChore = await prisma.chore.findUnique({
      where: { id },
    });

    if (!existingChore) {
      return res.status(404).json({ error: 'Chore not found' });
    }

    if (existingChore.householdId !== user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete chore
    await prisma.chore.delete({
      where: { id },
    });

    res.json({ message: 'Chore deleted successfully' });
  } catch (error) {
    console.error('Delete chore error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

