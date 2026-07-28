-- AlterTable
ALTER TABLE `Product` ADD COLUMN `promoEndsAt` DATETIME(3) NULL,
    ADD COLUMN `promoSlots` INTEGER NULL,
    ADD COLUMN `promoSold` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `subSubCategoryId` INTEGER NULL;

-- CreateTable
CREATE TABLE `SubSubCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `subCategoryId` INTEGER NOT NULL,

    UNIQUE INDEX `SubSubCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Product_subSubCategoryId_idx` ON `Product`(`subSubCategoryId`);

-- AddForeignKey
ALTER TABLE `SubSubCategory` ADD CONSTRAINT `SubSubCategory_subCategoryId_fkey` FOREIGN KEY (`subCategoryId`) REFERENCES `SubCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_subSubCategoryId_fkey` FOREIGN KEY (`subSubCategoryId`) REFERENCES `SubSubCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
