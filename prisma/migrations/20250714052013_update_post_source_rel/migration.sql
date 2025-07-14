-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_sourceId_fkey";

-- CreateTable
CREATE TABLE "_PostToSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToSource_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PostToSource_B_index" ON "_PostToSource"("B");

-- AddForeignKey
ALTER TABLE "_PostToSource" ADD CONSTRAINT "_PostToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToSource" ADD CONSTRAINT "_PostToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
