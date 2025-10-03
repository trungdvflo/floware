ALTER TABLE `linked_file_common`
ADD COLUMN `source_uid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `updated_date`;