CREATE TABLE `conference_history` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `member_id` bigint(20) NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` double(13,3) NOT NULL DEFAULT '0.000' COMMENT 'start time of the call',
  `end_time` double(13,3) NOT NULL DEFAULT '0.000' COMMENT 'end time of the call',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '1 = video, 2 = audio ',
  `status` tinyint(2) unsigned NOT NULL DEFAULT '0' COMMENT 'the status of the call',
  `caller_email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_time` double(13,3) NOT NULL DEFAULT '0.000',
  `meeting_id` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `external_meeting_id` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_user_id_and_member_id` (`user_id`,`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'