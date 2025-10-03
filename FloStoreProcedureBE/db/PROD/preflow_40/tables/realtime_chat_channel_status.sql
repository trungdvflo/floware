CREATE TABLE `realtime_chat_channel_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `channel_name` varchar(100) NOT NULL,
  `msg_count` int(11) NOT NULL DEFAULT '0',
  `last_send_time` double(13,3) NOT NULL COMMENT '0. unsent, 1. sent',
  `last_message_uid` varchar(300) NOT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_status_to_IDX` (`channel_name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1