CREATE TABLE `realtime_message_edited_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_uid` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `content_before` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_date` double(13,3) DEFAULT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  `deleted_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `realtime_message_edited_history_message_uid_IDX` (`message_uid`) USING BTREE,
  KEY `realtime_message_edited_history_email_IDX` (`email`) USING BTREE,
  KEY `realtime_message_edited_history_created_date_IDX` (`created_date`) USING BTREE,
  KEY `realtime_message_edited_history_updated_date_IDX` (`updated_date`) USING BTREE,
  KEY `realtime_message_edited_history_deleted_date_IDX` (`deleted_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1