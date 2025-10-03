CREATE TABLE `realtime_message_user_unsent` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_uid` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL COMMENT 'email',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_status_to_IDX` (`email`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1