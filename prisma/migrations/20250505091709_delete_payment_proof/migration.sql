/*
  Warnings:

  - You are about to drop the column `paymentProofUrl` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "paymentProofUrl";
