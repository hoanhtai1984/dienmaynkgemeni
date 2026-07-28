-- DropIndex
DROP INDEX `Customer_googleId_key` ON `Customer`;

-- DropIndex
DROP INDEX `Customer_facebookId_key` ON `Customer`;

-- AlterTable
ALTER TABLE `Customer` DROP COLUMN `googleId`,
    DROP COLUMN `facebookId`,
    MODIFY `password` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `OAuthSettings`;
