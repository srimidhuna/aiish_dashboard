-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('audiologist');

-- CreateEnum
CREATE TYPE "BabyStatus" AS ENUM ('draft', 'completed', 'follow_up_required', 'under_evaluation', 'under_treatment', 'closed');

-- CreateEnum
CREATE TYPE "ScreeningTestResult" AS ENUM ('pass', 'refer', 'noisy', 'cnt', 'not_done');

-- CreateEnum
CREATE TYPE "PassReferResult" AS ENUM ('pass', 'refer');

-- CreateEnum
CREATE TYPE "ReflexResult" AS ENUM ('normal', 'abnormal');

-- CreateEnum
CREATE TYPE "ConsanguinityDegree" AS ENUM ('first', 'second', 'third');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('phone', 'regular', 'not_applicable');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('urban', 'rural');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('normal', 'cesarean', 'assisted');

-- CreateEnum
CREATE TYPE "CategoryGroup" AS ENUM ('perinatal', 'postnatal', 'family_history', 'other');

-- CreateEnum
CREATE TYPE "TimelineEvent" AS ENUM ('registered', 'screened', 'follow_up_created', 'treatment_started', 'closed', 'other');

-- CreateTable
CREATE TABLE "states" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'audiologist',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_categories" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category_group" "CategoryGroup" NOT NULL,

    CONSTRAINT "risk_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_types" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "recommendation_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "babies" (
    "id" TEXT NOT NULL,
    "mr_number" TEXT,
    "pocd_number" TEXT,
    "unique_mother_id" TEXT,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "mother_name" TEXT NOT NULL,
    "father_name" TEXT,
    "address" TEXT,
    "taluk" TEXT,
    "district_id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "phone_1" TEXT,
    "phone_2" TEXT,
    "referred_by" TEXT,
    "nbs_centre" TEXT,
    "region" "Region",
    "education_level" TEXT,
    "religion" TEXT,
    "socio_economic_status" TEXT,
    "delivery_type" "DeliveryType",
    "no_of_siblings" INTEGER,
    "status" "BabyStatus" NOT NULL DEFAULT 'draft',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "babies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_risk_factors" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "risk_category_id" TEXT NOT NULL,

    CONSTRAINT "baby_risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audiologist_assessments" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "family_history_hearing_loss" BOOLEAN NOT NULL DEFAULT false,
    "consanguinity_degree" "ConsanguinityDegree",
    "caregiver_concern" BOOLEAN NOT NULL DEFAULT false,
    "reflex_moro" "ReflexResult",
    "reflex_rooting" "ReflexResult",
    "reflex_babinski" "ReflexResult",
    "reflex_palmar" "ReflexResult",
    "reflex_plantar" "ReflexResult",

    CONSTRAINT "audiologist_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screenings" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "ent_findings" TEXT,
    "boa_result" "PassReferResult",
    "teoae_right" "ScreeningTestResult",
    "teoae_left" "ScreeningTestResult",
    "dpoae_right" "ScreeningTestResult",
    "dpoae_left" "ScreeningTestResult",
    "aabr1_right" "ScreeningTestResult",
    "aabr1_left" "ScreeningTestResult",
    "aabr2_right" "ScreeningTestResult",
    "aabr2_left" "ScreeningTestResult",
    "overall_result" "PassReferResult",
    "remarks" TEXT,
    "tested_by" TEXT NOT NULL,
    "tested_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "follow_up_type" "FollowUpType" NOT NULL,
    "provisional_diagnosis_right" TEXT,
    "provisional_diagnosis_left" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_recommendations" (
    "id" TEXT NOT NULL,
    "follow_up_id" TEXT NOT NULL,
    "recommendation_type_id" TEXT NOT NULL,

    CONSTRAINT "baby_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_timelines" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "event" "TimelineEvent" NOT NULL,
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "states_name_key" ON "states"("name");

-- CreateIndex
CREATE UNIQUE INDEX "districts_name_state_id_key" ON "districts"("name", "state_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "risk_categories_label_key" ON "risk_categories"("label");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_types_label_key" ON "recommendation_types"("label");

-- CreateIndex
CREATE UNIQUE INDEX "baby_risk_factors_baby_id_risk_category_id_key" ON "baby_risk_factors"("baby_id", "risk_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "audiologist_assessments_baby_id_key" ON "audiologist_assessments"("baby_id");

-- CreateIndex
CREATE UNIQUE INDEX "baby_recommendations_follow_up_id_recommendation_type_id_key" ON "baby_recommendations"("follow_up_id", "recommendation_type_id");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "babies" ADD CONSTRAINT "babies_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "babies" ADD CONSTRAINT "babies_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "babies" ADD CONSTRAINT "babies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "babies" ADD CONSTRAINT "babies_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_risk_factors" ADD CONSTRAINT "baby_risk_factors_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_risk_factors" ADD CONSTRAINT "baby_risk_factors_risk_category_id_fkey" FOREIGN KEY ("risk_category_id") REFERENCES "risk_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audiologist_assessments" ADD CONSTRAINT "audiologist_assessments_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_tested_by_fkey" FOREIGN KEY ("tested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_recommendations" ADD CONSTRAINT "baby_recommendations_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "follow_ups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_recommendations" ADD CONSTRAINT "baby_recommendations_recommendation_type_id_fkey" FOREIGN KEY ("recommendation_type_id") REFERENCES "recommendation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_timelines" ADD CONSTRAINT "patient_timelines_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_timelines" ADD CONSTRAINT "patient_timelines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

