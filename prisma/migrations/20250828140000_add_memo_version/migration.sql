-- CreateTable: MemoVersion (versioned history of memos)
CREATE TABLE IF NOT EXISTS "public"."MemoVersion" (
    "id" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "ops" JSONB,
    CONSTRAINT "MemoVersion_pkey" PRIMARY KEY ("id")
);

-- Unique index for (memoId, version)
CREATE UNIQUE INDEX IF NOT EXISTS "MemoVersion_memoId_version_key"
ON "public"."MemoVersion" ("memoId", "version");

-- Foreign key to Memo
ALTER TABLE "public"."MemoVersion"
ADD CONSTRAINT "MemoVersion_memoId_fkey"
FOREIGN KEY ("memoId") REFERENCES "public"."Memo"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

