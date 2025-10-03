CREATE TABLE `conference_chat` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `parent_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `conference_member_id` bigint(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message_uid` varbinary(1000) NOT NULL,
  `message_text` text NOT NULL,
  `message_type` tinyint(1) NOT NULL DEFAULT '0',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_on_userId_msgUid` (`user_id`,`message_uid`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_updated_date2` (`updated_date`),
  KEY `idx_updated_date` (`updated_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1