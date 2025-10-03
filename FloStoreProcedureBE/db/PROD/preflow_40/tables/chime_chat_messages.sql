CREATE TABLE `chime_chat_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `internal_message_uid` varchar(500) NOT NULL,
  `channel_id` bigint(20) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `migrate_time` double(13,3) NOT NULL DEFAULT '0.000' COMMENT 'create time message from Chime Service',
  PRIMARY KEY (`id`),
  KEY `chime_chat_messages_internal_message_uid_IDX` (`internal_message_uid`,`is_deleted`,`user_id`) USING BTREE,
  KEY `chime_chat_messages_migrate_time_IDX` (`migrate_time`,`channel_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8