-- CreateEnum
CREATE TYPE "ReferredBy" AS ENUM ('pocd_staff', 'doctor', 'self', 'others');

-- CreateEnum
CREATE TYPE "SocioEconomicStatus" AS ENUM ('aay', 'bpl', 'apl');

-- CreateEnum
CREATE TYPE "EducationLevelParent" AS ENUM ('illiterate', 'primary', 'high_school', 'graduate_and_above', 'others');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('hindu', 'muslim', 'christian', 'others');

-- CreateEnum
CREATE TYPE "HospitalStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('draft', 'scheduled', 'completed');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('scheduled', 'completed', 'missed', 'lost_to_followup', 'rescheduled');

-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryType_new" AS ENUM ('normal', 'caesarean', 'breech', 'home');
ALTER TABLE "babies" ALTER COLUMN "delivery_type" TYPE "DeliveryType_new" USING ("delivery_type"::text::"DeliveryType_new");
ALTER TYPE "DeliveryType" RENAME TO "DeliveryType_old";
ALTER TYPE "DeliveryType_new" RENAME TO "DeliveryType";
DROP TYPE "DeliveryType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'admin';
ALTER TYPE "UserRole" ADD VALUE 'doctor';

-- AlterTable
ALTER TABLE "babies" DROP COLUMN "name",
ADD COLUMN     "birth_weight_grams" INTEGER,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "doctor_name" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "gestational_age_weeks" INTEGER,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "pin_code" TEXT,
ADD COLUMN     "place_of_birth" TEXT,
ADD COLUMN     "referred_by_other" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "time_of_birth" TEXT,
DROP COLUMN "referred_by",
ADD COLUMN     "referred_by" "ReferredBy",
DROP COLUMN "education_level",
ADD COLUMN     "education_level" "EducationLevelParent",
DROP COLUMN "religion",
ADD COLUMN     "religion" "Religion",
DROP COLUMN "socio_economic_status",
ADD COLUMN     "socio_economic_status" "SocioEconomicStatus";

-- AlterTable
ALTER TABLE "follow_ups" ADD COLUMN     "actual_date" TIMESTAMP(3),
ADD COLUMN     "next_steps" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "provider_id" TEXT NOT NULL,
ADD COLUMN     "scheduled_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "FollowUpStatus" NOT NULL DEFAULT 'scheduled';

-- AlterTable
ALTER TABLE "hospitals" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "primary_audiologist_id" TEXT,
ADD COLUMN     "status" "HospitalStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "assigned_audiologist_id" TEXT,
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "status" "ScreeningStatus" NOT NULL DEFAULT 'draft',
DROP COLUMN "boa_result",
ADD COLUMN     "boa_result" "ScreeningTestResult";

-- AddForeignKey
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_primary_audiologist_id_fkey" FOREIGN KEY ("primary_audiologist_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_assigned_audiologist_id_fkey" FOREIGN KEY ("assigned_audiologist_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
