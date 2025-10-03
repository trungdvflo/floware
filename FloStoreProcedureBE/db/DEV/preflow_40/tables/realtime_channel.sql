CREATE TABLE `realtime_channel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '""',
  `type` enum('CONFERENCE','COLLECTION') NOT NULL DEFAULT 'CONFERENCE',
  `internal_channel_id` bigint(20) NOT NULL COMMENT 'Collection id or conference_channel id',
  `created_date` double(13,3) DEFAULT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  `realtime_channelcol` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `realtime_channel_UN` (`name`),
  KEY `unq_on_type_and_internal_id` (`type`,`internal_channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1