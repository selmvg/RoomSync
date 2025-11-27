import express, { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    // Get all notifications for the user
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { isRead } = req.body;

    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update notification
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: isRead !== undefined ? isRead : true,
      },
    });

    res.json({ notification: updated });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Mark all notifications as read
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

