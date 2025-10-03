CREATE TABLE `realtime_channel_member` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `channel_id` int(11) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `revoke_date` double(13,3) DEFAULT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_channel_member_UN` (`email`,`channel_id`),
  KEY `notification_channel_member_channel_id_IDX` (`channel_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1