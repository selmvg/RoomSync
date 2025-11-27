-- AlterTable
ALTER TABLE "Chore" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceDayOfWeek" INTEGER,
ADD COLUMN     "recurrencePattern" TEXT,
ADD COLUMN     "rotationOrder" JSONB,
ADD COLUMN     "useRotation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ChoreComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "choreId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChoreComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChoreComment" ADD CONSTRAINT "ChoreComment_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreComment" ADD CONSTRAINT "ChoreComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
