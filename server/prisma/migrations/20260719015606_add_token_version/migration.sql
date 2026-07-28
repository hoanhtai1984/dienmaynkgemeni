-- AlterTable
ALTER TABLE `Admin` ADD COLUMN `tokenVersion` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `tokenVersion` INTEGER NOT NULL DEFAULT 0;
