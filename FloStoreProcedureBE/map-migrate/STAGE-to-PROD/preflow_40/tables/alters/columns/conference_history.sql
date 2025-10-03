ALTER TABLE `conference_history`
ADD COLUMN `phone_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' AFTER `invitee`;