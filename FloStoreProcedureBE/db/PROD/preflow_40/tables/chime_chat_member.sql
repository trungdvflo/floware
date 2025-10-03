CREATE TABLE `chime_chat_member` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_instance_user_arn` text NOT NULL,
  `internal_user_id` bigint(20) DEFAULT NULL,
  `internal_user_email` varchar(255) DEFAULT NULL,
  `created_date` double(13,3) DEFAULT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chime_chat_member_UN` (`internal_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8