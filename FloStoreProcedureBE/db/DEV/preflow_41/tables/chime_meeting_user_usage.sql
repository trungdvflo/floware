CREATE TABLE `chime_meeting_user_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `meeting_internet_spent` int(11) NOT NULL DEFAULT '0' COMMENT 'time in seconds',
  `meeting_dial_outbound_spent` int(11) NOT NULL DEFAULT '0' COMMENT 'time in seconds',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `chime_meeting_user_usage_email_IDX` (`email`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8