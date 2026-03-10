-- AlterTable
ALTER TABLE "Turf" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Demo Turf';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skillLevel" TEXT NOT NULL DEFAULT 'Beginner';
