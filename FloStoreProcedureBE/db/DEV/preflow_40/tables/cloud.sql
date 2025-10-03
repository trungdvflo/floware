CREATE TABLE `cloud` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `uid` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `real_filename` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ext` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `device_uid` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `bookmark_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int(11) DEFAULT '0',
  `upload_status` tinyint(1) unsigned DEFAULT '0',
  `order_number` decimal(20,10) DEFAULT '0.0000000000',
  `order_update_time` double(13,3) DEFAULT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_on_user_id_and_order_number` (`user_id`,`order_number`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='utf8_unicode_ci'