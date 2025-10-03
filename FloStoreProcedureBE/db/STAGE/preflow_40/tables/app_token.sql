CREATE TABLE `app_token` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `app_preg_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `key_api` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `time_expire` double(13,3) NOT NULL,
  `created_time` double(13,3) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_key_api` (`key_api`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='utf8_unicode_ci'