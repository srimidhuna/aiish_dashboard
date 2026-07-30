-- CreateIndex
CREATE INDEX "babies_deleted_at_created_at_idx" ON "babies"("deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "babies_district_id_idx" ON "babies"("district_id");

-- CreateIndex
CREATE INDEX "babies_hospital_id_idx" ON "babies"("hospital_id");

-- CreateIndex
CREATE INDEX "follow_ups_baby_id_idx" ON "follow_ups"("baby_id");

-- CreateIndex
CREATE INDEX "follow_ups_scheduled_date_idx" ON "follow_ups"("scheduled_date");

-- CreateIndex
CREATE INDEX "follow_ups_status_idx" ON "follow_ups"("status");

-- CreateIndex
CREATE INDEX "screenings_baby_id_idx" ON "screenings"("baby_id");

-- CreateIndex
CREATE INDEX "screenings_tested_at_idx" ON "screenings"("tested_at");

-- CreateIndex
CREATE INDEX "screenings_status_idx" ON "screenings"("status");
