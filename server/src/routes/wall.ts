import express, { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createNotification } from '../lib/notifications';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/wall
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

    // Get all wall posts for the household
    const posts = await prisma.wallPost.findMany({
      where: { householdId: user.householdId },
      include: {
        author: {
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

    res.json({ posts });
  } catch (error) {
    console.error('Get wall posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/wall
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true, name: true },
    });

    if (!user?.householdId) {
      return res.status(400).json({ error: 'User does not belong to a household' });
    }

    // Create wall post
    const post = await prisma.wallPost.create({
      data: {
        content: content.trim(),
        householdId: user.householdId,
        authorId: userId,
      },
      include: {
        author: {
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
      type: 'wall_post',
      message: `${user.name} posted on the household wall`,
      relatedPostId: post.id,
    });

    res.status(201).json({ post });
  } catch (error) {
    console.error('Create wall post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/wall/:id
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

    // Verify post belongs to user's household
    const existingPost = await prisma.wallPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.householdId !== user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow author to delete their own post
    if (existingPost.authorId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Delete post
    await prisma.wallPost.delete({
      where: { id },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete wall post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

