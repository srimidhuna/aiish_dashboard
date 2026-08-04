-- CreateEnum
CREATE TYPE "ScreeningType" AS ENUM ('initial', 'rescreening');

-- AlterTable
ALTER TABLE "screenings" ADD COLUMN "type" "ScreeningType" NOT NULL DEFAULT 'initial';
