CREATE TABLE `chime_chat_channel` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `internal_channel_id` bigint(20) NOT NULL,
  `channel_arn` varchar(2000) NOT NULL,
  `internal_channel_type` tinyint(1) NOT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chime_chat_channel_UN` (`internal_channel_id`,`internal_channel_type`),
  KEY `chime_chat_channel_internal_channel_type_IDX` (`internal_channel_type`,`internal_channel_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8