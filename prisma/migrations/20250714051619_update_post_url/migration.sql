/*
  Warnings:

  - The `url` column on the `Post` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "Post_url_key";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "url",
ADD COLUMN     "url" TEXT[];
