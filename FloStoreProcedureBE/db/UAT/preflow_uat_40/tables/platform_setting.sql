CREATE TABLE `platform_setting` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `data_setting` json NOT NULL,
  `app_reg_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `app_version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_on_user_id_and_app_version` (`user_id`,`app_version`) USING BTREE,
  KEY `idx_on_user_id_and_app_reg_id` (`user_id`,`app_reg_id`) USING BTREE,
  KEY `idx_on_user_id_and_app_reg_id_and_app_version` (`user_id`,`app_reg_id`,`app_version`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='utf8mb4_unicode_ci'