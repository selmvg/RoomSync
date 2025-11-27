import { prisma } from './prisma';

interface CreateNotificationParams {
  userId: string; // The user who triggered the notification (excluded from receiving it)
  householdId: string;
  type: 'expense_added' | 'chore_completed' | 'wall_post' | 'shopping_item_added';
  message: string;
  relatedExpenseId?: string;
  relatedChoreId?: string;
  relatedPostId?: string;
  relatedItemId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    // Get all household members except the user who triggered the notification
    const household = await prisma.household.findUnique({
      where: { id: params.householdId },
      include: {
        members: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!household) {
      return;
    }

    // Create notifications for all other members
    const otherMembers = household.members.filter((member) => member.id !== params.userId);

    await Promise.all(
      otherMembers.map((member) =>
        prisma.notification.create({
          data: {
            type: params.type,
            message: params.message,
            userId: member.id,
            relatedExpenseId: params.relatedExpenseId || null,
            relatedChoreId: params.relatedChoreId || null,
            relatedPostId: params.relatedPostId || null,
            relatedItemId: params.relatedItemId || null,
          },
        })
      )
    );
  } catch (error) {
    console.error('Error creating notifications:', error);
    // Don't throw - notifications are not critical
  }
}

