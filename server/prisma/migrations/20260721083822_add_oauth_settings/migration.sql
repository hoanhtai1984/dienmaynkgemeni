-- CreateTable
CREATE TABLE `OAuthSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `googleClientId` VARCHAR(191) NULL,
    `facebookAppId` VARCHAR(191) NULL,
    `facebookAppSecret` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
