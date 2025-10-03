ALTER TABLE `user`
ADD COLUMN `digestb` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL AFTER `updated_date`;