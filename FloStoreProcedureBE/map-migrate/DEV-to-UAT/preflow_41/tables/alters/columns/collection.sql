ALTER TABLE `collection`
ADD COLUMN `realtime_channel` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT '' AFTER `name`;