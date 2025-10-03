CREATE TABLE `realtime_user_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(200) NOT NULL,
  `name` varchar(200) NOT NULL,
  `value` text NOT NULL,
  `channel` varchar(200) DEFAULT NULL COMMENT 'apply to all channel if this value is null',
  `created_date` double DEFAULT NULL,
  `updated_date` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `realtime_settings_UN` (`email`,`name`),
  UNIQUE KEY `realtime_user_settings_UN` (`email`,`name`,`channel`),
  KEY `realtime_settings_email_IDX` (`email`) USING BTREE,
  KEY `realtime_user_settings_channel_id_IDX` (`channel`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8