CREATE TABLE `conference_channel` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `uid` varchar(255) NOT NULL,
  `realtime_channel` varchar(100) NOT NULL DEFAULT '',
  `room_url` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel_arn` varchar(2000) DEFAULT NULL,
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  `last_used` double(13,3) NOT NULL,
  `revoke_time` double(13,3) DEFAULT NULL,
  `enable_chat_history` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `conference_channel_last_used_IDX` (`last_used`,`updated_date`,`created_date`) USING BTREE,
  KEY `conference_channel_uid_IDX` (`uid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1