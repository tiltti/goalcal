-- CreateTable
CREATE TABLE "DayEntry" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "noSubstances" BOOLEAN NOT NULL DEFAULT false,
    "exercise" BOOLEAN NOT NULL DEFAULT false,
    "writing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DayEntry_date_key" ON "DayEntry"("date");

-- CreateIndex
CREATE INDEX "DayEntry_year_idx" ON "DayEntry"("year");

-- CreateIndex
CREATE INDEX "DayEntry_year_month_idx" ON "DayEntry"("year", "month");
