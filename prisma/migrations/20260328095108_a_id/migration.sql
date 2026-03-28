/*
  Warnings:

  - Added the required column `a_id` to the `Vacancy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vacancy" ADD COLUMN     "a_id" TEXT NOT NULL,
ADD COLUMN     "is_private" BOOLEAN NOT NULL DEFAULT true;
