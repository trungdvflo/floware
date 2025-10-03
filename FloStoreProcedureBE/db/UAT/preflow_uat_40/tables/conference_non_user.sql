CREATE TABLE `conference_non_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `meeting_config` json NOT NULL,
  `external_attendee` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `join_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  `meeting_id` varchar(500) NOT NULL,
  `attendee_id` varchar(300) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `conference_non_user_meeting_id_IDX` (`meeting_id`) USING BTREE,
  FULLTEXT KEY `conference_non_user_external_attendee_IDX` (`external_attendee`,`join_token`),
  FULLTEXT KEY `conference_non_user_meeting_id_attendee_idIDX` (`meeting_id`,`attendee_id`),
  FULLTEXT KEY `conference_non_user_extenal_attendee_IDX` (`external_attendee`,`join_token`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1