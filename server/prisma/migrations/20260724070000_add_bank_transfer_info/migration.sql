-- AlterTable
ALTER TABLE `SiteSettings` ADD COLUMN `bankName` VARCHAR(191) NULL,
    ADD COLUMN `bankAccountNumber` VARCHAR(191) NULL,
    ADD COLUMN `bankAccountHolder` VARCHAR(191) NULL,
    ADD COLUMN `bankQrImage` VARCHAR(191) NULL;
