CREATE TABLE `conference_meeting` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `channel_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL DEFAULT '0' COMMENT 'Id of caller',
  `meeting_id` varchar(100) NOT NULL,
  `external_meeting_id` text,
  `meeting_url` text,
  `provider` varchar(45) NOT NULL DEFAULT 'CHIME',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_channel_id_and_meeting_id` (`channel_id`,`meeting_id`),
  KEY `idx_updated_date` (`updated_date`),
  KEY `idx_created_date` (`created_date`),
  KEY `unq_channel_id_meeting_id` (`channel_id`,`meeting_id`,`provider`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1