/*
  Warnings:

  - You are about to drop the column `diagnosis` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `type_id` on the `Client` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_type_id_fkey";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "diagnosis",
DROP COLUMN "type_id";

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "report" TEXT,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
