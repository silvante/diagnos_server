/*
  Warnings:

  - You are about to drop the `JoinRequestType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JoinRequestType" DROP CONSTRAINT "JoinRequestType_applicant_id_fkey";

-- DropForeignKey
ALTER TABLE "JoinRequestType" DROP CONSTRAINT "JoinRequestType_org_id_fkey";

-- DropTable
DROP TABLE "JoinRequestType";

-- CreateTable
CREATE TABLE "JoinRequest" (
    "id" SERIAL NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
    "applicant_id" INTEGER NOT NULL,
    "org_id" INTEGER NOT NULL,
    "role" "WorkerRoles" NOT NULL DEFAULT 'receptionist',

    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
