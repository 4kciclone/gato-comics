-- CreateTable
CREATE TABLE "work_views" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_views_workId_viewedAt_idx" ON "work_views"("workId", "viewedAt");

-- AddForeignKey
ALTER TABLE "work_views" ADD CONSTRAINT "work_views_workId_fkey" FOREIGN KEY ("workId") REFERENCES "works"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
