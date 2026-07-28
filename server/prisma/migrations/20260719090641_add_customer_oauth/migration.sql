-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `facebookId` VARCHAR(191) NULL,
    ADD COLUMN `googleId` VARCHAR(191) NULL,
    MODIFY `password` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Customer_googleId_key` ON `Customer`(`googleId`);

-- CreateIndex
CREATE UNIQUE INDEX `Customer_facebookId_key` ON `Customer`(`facebookId`);
