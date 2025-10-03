CREATE TABLE `gmail_accesstoken` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'Just tracking who upload/create this release Flo app',
  `app_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_token` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gmail` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_key` text COLLATE utf8mb4_unicode_ci,
  `access_token` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `refresh_token` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_type` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiry_date` bigint(20) DEFAULT NULL,
  `status` enum('0','1') COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '0: Not registered to receive mail notifications\n1: Already registered to receive email notifications\n',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_on_userid_and_app_id_and_gmail_and_device_token` (`user_id`,`app_id`,`gmail`,`device_token`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci