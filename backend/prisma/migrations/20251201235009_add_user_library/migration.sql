-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('LENDO', 'LEREI', 'COMPLETO', 'DROPADO', 'NENHUM');

-- CreateTable
CREATE TABLE "user_libraries" (
    "userId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'NENHUM',
    "rating" INTEGER,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_libraries_pkey" PRIMARY KEY ("userId","workId")
);

-- AddForeignKey
ALTER TABLE "user_libraries" ADD CONSTRAINT "user_libraries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_libraries" ADD CONSTRAINT "user_libraries_workId_fkey" FOREIGN KEY ("workId") REFERENCES "works"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
