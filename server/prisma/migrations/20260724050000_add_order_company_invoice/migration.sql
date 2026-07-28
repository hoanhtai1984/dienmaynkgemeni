-- AlterTable
ALTER TABLE `Order` ADD COLUMN `invoiceRequested` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `companyName` VARCHAR(191) NULL,
    ADD COLUMN `companyTaxCode` VARCHAR(191) NULL,
    ADD COLUMN `companyAddress` VARCHAR(191) NULL,
    ADD COLUMN `companyEmail` VARCHAR(191) NULL;
