CREATE TABLE `realtime_message_user_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_uid` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL COMMENT 'email',
  `status` tinyint(4) NOT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `realtime_message_user_status_UN` (`message_uid`,`email`),
  KEY `notification_status_to_IDX` (`email`) USING BTREE,
  KEY `realtime_message_user_status_status_IDX` (`status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1