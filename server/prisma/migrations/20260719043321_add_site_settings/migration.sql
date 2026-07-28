-- CreateTable
CREATE TABLE `SiteSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `hotline` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `companyTaxCode` VARCHAR(191) NOT NULL,
    `workingHours` VARCHAR(191) NOT NULL,
    `facebookUrl` VARCHAR(191) NULL,
    `zaloUrl` VARCHAR(191) NULL,
    `youtubeUrl` VARCHAR(191) NULL,
    `tiktokUrl` VARCHAR(191) NULL,
    `instagramUrl` VARCHAR(191) NULL,
    `aboutText` TEXT NOT NULL,
    `buyingGuideSteps` JSON NOT NULL,
    `faqItems` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
