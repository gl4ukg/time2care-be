-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'nurse';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordToken" TEXT;
