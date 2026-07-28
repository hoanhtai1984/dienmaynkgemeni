-- AlterTable
ALTER TABLE `OAuthSettings` ADD COLUMN `googleLoginEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `facebookLoginEnabled` BOOLEAN NOT NULL DEFAULT true;
