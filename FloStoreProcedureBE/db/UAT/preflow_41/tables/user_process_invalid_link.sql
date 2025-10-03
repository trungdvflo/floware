CREATE TABLE `user_process_invalid_link` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `username` varchar(255) NOT NULL,
  `object_scanning` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0: Failed\\n1: Processing\\n2: Completed\\n',
  `email_scanning` tinyint(1) NOT NULL DEFAULT '0',
  `email_scanned_date` double(13,3) DEFAULT NULL,
  `object_scanned_date` double(13,3) DEFAULT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_id` (`user_id`),
  KEY `idx_updated_date` (`updated_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1