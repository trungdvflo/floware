ALTER TABLE `setting`
ADD COLUMN `notification_clean_date` int(11) NOT NULL DEFAULT '2592000' COMMENT 'DEFAULT: 43200 = 1 MONTH IN SECOND' AFTER `todo_collection_id`;