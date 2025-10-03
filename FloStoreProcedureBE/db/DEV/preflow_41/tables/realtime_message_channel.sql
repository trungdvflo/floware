CREATE TABLE `realtime_message_channel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `channel_name` varchar(100) NOT NULL,
  `message_uid` varchar(100) NOT NULL,
  `created_date` double(13,3) DEFAULT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `realtime_message_channel_message_uid_IDX` (`message_uid`) USING BTREE,
  KEY `realtime_message_channel_channel_name_IDX` (`channel_name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1