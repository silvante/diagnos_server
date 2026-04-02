/*
  Warnings:

  - You are about to drop the `Vacancy` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- DropForeignKey
ALTER TABLE "Vacancy" DROP CONSTRAINT "Vacancy_user_id_fkey";

-- DropTable
DROP TABLE "Vacancy";

-- CreateTable
CREATE TABLE "JoinRequestType" (
    "id" SERIAL NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
    "applicant_id" INTEGER NOT NULL,
    "org_id" INTEGER NOT NULL,
    "role" "WorkerRoles" NOT NULL DEFAULT 'receptionist',

    CONSTRAINT "JoinRequestType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JoinRequestType" ADD CONSTRAINT "JoinRequestType_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequestType" ADD CONSTRAINT "JoinRequestType_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
