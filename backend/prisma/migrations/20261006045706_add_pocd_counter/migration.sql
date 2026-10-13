-- CreateTable
CREATE TABLE "pocd_counters" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pocd_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pocd_counters_year_key" ON "pocd_counters"("year");
