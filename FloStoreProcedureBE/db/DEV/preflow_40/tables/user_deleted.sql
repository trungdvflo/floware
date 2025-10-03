CREATE TABLE `user_deleted` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `username` varchar(255) CHARACTER SET utf8 NOT NULL,
  `is_disabled` tinyint(1) NOT NULL,
  `progress` tinyint(1) NOT NULL,
  `cleaning_date` double(13,3) unsigned NOT NULL,
  `created_date` double(13,3) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_id` (`user_id`),
  UNIQUE KEY `uniq_username` (`username`),
  KEY `idx_progress` (`progress`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1