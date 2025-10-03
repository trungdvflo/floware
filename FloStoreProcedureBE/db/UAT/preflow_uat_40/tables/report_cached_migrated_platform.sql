CREATE TABLE `report_cached_migrated_platform` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `app_reg_id` varchar(255) NOT NULL,
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_app_reg_id` (`user_id`,`app_reg_id`) USING BTREE,
  KEY `user_id` (`user_id`) USING BTREE,
  KEY `app_reg_id` (`app_reg_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1