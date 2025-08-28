-- DropForeignKey
ALTER TABLE "public"."MemoVersion" DROP CONSTRAINT "MemoVersion_memoId_fkey";

-- AddForeignKey
ALTER TABLE "public"."MemoVersion" ADD CONSTRAINT "MemoVersion_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "public"."Memo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
