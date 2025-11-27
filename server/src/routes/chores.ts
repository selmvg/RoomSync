import express, { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createNotification } from '../lib/notifications';

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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
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
    const { 
      title, 
      assignedToId, 
      isRecurring, 
      recurrencePattern, 
      recurrenceDayOfWeek,
      useRotation,
      rotationOrder,
      dueDate 
    } = req.body;

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

    // Get household members for rotation
    const household = await prisma.household.findUnique({
      where: { id: user.householdId },
      include: {
        members: {
          select: {
            id: true,
          },
        },
      },
    });

    let finalAssignedToId = assignedToId || null;
    let finalRotationOrder = rotationOrder;

    // Handle rotation logic
    if (useRotation && household?.members) {
      // If rotation order not provided, use all household members
      if (!rotationOrder || !Array.isArray(rotationOrder) || rotationOrder.length === 0) {
        finalRotationOrder = household.members.map(m => m.id);
      }
      
      // Assign to first person in rotation if no one assigned
      if (!finalAssignedToId && finalRotationOrder && finalRotationOrder.length > 0) {
        finalAssignedToId = finalRotationOrder[0];
      }
    }

    // Verify assignedToId belongs to the same household if provided
    if (finalAssignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
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
        assignedToId: finalAssignedToId,
        isRecurring: isRecurring || false,
        recurrencePattern: recurrencePattern || null,
        recurrenceDayOfWeek: recurrenceDayOfWeek !== undefined ? recurrenceDayOfWeek : null,
        useRotation: useRotation || false,
        rotationOrder: finalRotationOrder ? finalRotationOrder : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
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
    const { 
      title, 
      isComplete, 
      assignedToId,
      isRecurring,
      recurrencePattern,
      recurrenceDayOfWeek,
      useRotation,
      rotationOrder,
      dueDate 
    } = req.body;

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true, name: true },
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

    // Handle rotation when completing a recurring chore
    let finalAssignedToId = assignedToId;
    if (isComplete === true && existingChore.isRecurring && existingChore.useRotation && existingChore.rotationOrder) {
      const rotation = existingChore.rotationOrder as string[];
      const currentIndex = rotation.indexOf(existingChore.assignedToId || '');
      
      if (currentIndex !== -1 && rotation.length > 0) {
        // Move to next person in rotation
        const nextIndex = (currentIndex + 1) % rotation.length;
        finalAssignedToId = rotation[nextIndex];
      }
    }

    // Verify assignedToId belongs to the same household if provided
    if (finalAssignedToId !== undefined && finalAssignedToId !== null) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
        select: { householdId: true },
      });

      if (assignedUser?.householdId !== user.householdId) {
        return res.status(400).json({ error: 'Assigned user must belong to the same household' });
      }
    }

    // Update chore
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (isComplete !== undefined) {
      updateData.isComplete = isComplete;
      if (isComplete) {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    if (finalAssignedToId !== undefined) updateData.assignedToId = finalAssignedToId || null;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurrencePattern !== undefined) updateData.recurrencePattern = recurrencePattern || null;
    if (recurrenceDayOfWeek !== undefined) updateData.recurrenceDayOfWeek = recurrenceDayOfWeek !== null ? recurrenceDayOfWeek : null;
    if (useRotation !== undefined) updateData.useRotation = useRotation;
    if (rotationOrder !== undefined) updateData.rotationOrder = rotationOrder || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    // If completing a recurring chore, reset it for next occurrence
    if (isComplete === true && existingChore.isRecurring) {
      updateData.isComplete = false; // Reset for next occurrence
      updateData.completedAt = null;
    }

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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    // Create notification when chore is completed
    if (isComplete === true && !existingChore.isComplete && user) {
      await createNotification({
        userId: userId,
        householdId: user.householdId || '',
        type: 'chore_completed',
        message: `${user.name} completed the chore: "${chore.title}"`,
        relatedChoreId: chore.id,
      });
    }

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

// POST /api/chores/:id/comments
router.post('/:id/comments', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

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

    // Create comment
    const comment = await prisma.choreComment.create({
      data: {
        content: content.trim(),
        choreId: id,
        userId: userId,
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

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

