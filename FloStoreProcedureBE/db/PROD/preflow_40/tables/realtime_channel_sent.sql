CREATE TABLE `realtime_channel_sent` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_uid` int(11) NOT NULL,
  `to_channel` varchar(100) NOT NULL,
  `status` tinyint(4) DEFAULT NULL COMMENT '0. unsent, 1. sent',
  `sent_time` double(13,3) DEFAULT NULL,
  `send_by_email` varchar(100) DEFAULT NULL COMMENT '0: send by system',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_status_to_IDX` (`to_channel`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1