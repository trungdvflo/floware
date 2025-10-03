ALTER TABLE `conference_channel`
ADD COLUMN `last_used` double(13,3) NOT NULL AFTER `updated_date`;