import express, { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createNotification } from '../lib/notifications';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/shopping
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

    // Get all shopping items for the household
    const items = await prisma.shoppingItem.findMany({
      where: { householdId: user.householdId },
      include: {
        addedBy: {
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

    res.json({ items });
  } catch (error) {
    console.error('Get shopping items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shopping
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true, name: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Create shopping item
    const item = await prisma.shoppingItem.create({
      data: {
        name: name.trim(),
        householdId: user.householdId,
        addedById: userId,
      },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create notification for other household members
    await createNotification({
      userId: userId,
      householdId: user.householdId,
      type: 'shopping_item_added',
      message: `${user.name} added "${name.trim()}" to the shopping list`,
      relatedItemId: item.id,
    });

    res.status(201).json({ item });
  } catch (error) {
    console.error('Create shopping item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/shopping/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name, isPurchased } = req.body;

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Verify item belongs to user's household
    const existingItem = await prisma.shoppingItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Shopping item not found' });
    }

    if (existingItem.householdId !== user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update item
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (isPurchased !== undefined) updateData.isPurchased = isPurchased;

    const item = await prisma.shoppingItem.update({
      where: { id },
      data: updateData,
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ item });
  } catch (error) {
    console.error('Update shopping item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/shopping/:id
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

    // Verify item belongs to user's household
    const existingItem = await prisma.shoppingItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Shopping item not found' });
    }

    if (existingItem.householdId !== user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete item
    await prisma.shoppingItem.delete({
      where: { id },
    });

    res.json({ message: 'Shopping item deleted successfully' });
  } catch (error) {
    console.error('Delete shopping item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

