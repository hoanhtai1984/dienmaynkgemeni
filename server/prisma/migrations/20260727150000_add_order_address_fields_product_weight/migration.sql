-- AlterTable
ALTER TABLE `Product` ADD COLUMN `weight` INTEGER NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `provinceCode` VARCHAR(191) NULL,
    ADD COLUMN `provinceName` VARCHAR(191) NULL,
    ADD COLUMN `wardCode` VARCHAR(191) NULL,
    ADD COLUMN `wardName` VARCHAR(191) NULL,
    ADD COLUMN `addressDetail` VARCHAR(191) NULL;
