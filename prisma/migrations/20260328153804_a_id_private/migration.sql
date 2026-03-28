/*
  Warnings:

  - A unique constraint covering the columns `[a_id]` on the table `Vacancy` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Vacancy_a_id_key" ON "Vacancy"("a_id");
