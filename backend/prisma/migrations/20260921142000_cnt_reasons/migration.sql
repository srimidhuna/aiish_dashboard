-- AlterEnum
ALTER TYPE "ReflexResult" ADD VALUE 'cnt';

-- AlterEnum
ALTER TYPE "ScreeningTestResult" ADD VALUE 'na';

-- AlterTable
ALTER TABLE "audiologist_assessments" ADD COLUMN "reflex_sucking" "ReflexResult";
