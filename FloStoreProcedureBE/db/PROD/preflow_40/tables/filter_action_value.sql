CREATE TABLE `filter_action_value` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `filter_action_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_filter_action_id` (`filter_action_id`) USING BTREE,
  CONSTRAINT `cst_filter_action_values` FOREIGN KEY (`filter_action_id`) REFERENCES `filter_action` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='utf8mb4_unicode_ci'