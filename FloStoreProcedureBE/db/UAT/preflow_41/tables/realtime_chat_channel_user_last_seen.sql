CREATE TABLE `realtime_chat_channel_user_last_seen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `channel_name` varchar(100) NOT NULL,
  `last_seen` double(13,3) NOT NULL,
  `last_message_uid` varchar(100) NOT NULL,
  `unread` int(11) NOT NULL DEFAULT '0',
  `remine` int(11) DEFAULT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `realtime_chat_channel_user_last_seen_UN` (`email`,`channel_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8