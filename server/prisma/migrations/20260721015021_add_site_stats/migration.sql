-- CreateTable
CREATE TABLE `SiteStats` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `likeCount` INTEGER NOT NULL DEFAULT 0,
    `visitCount` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
