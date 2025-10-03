CREATE TABLE `collection_criteria_history` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `collection_id` bigint(20) unsigned NOT NULL,
  `object_type` varbinary(50) NOT NULL,
  `criteria_type` int(11) NOT NULL DEFAULT '0',
  `criteria_value` text COLLATE utf8mb4_unicode_ci,
  `created_date` double(13,3) NOT NULL,
  `criteria_action_group` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='utf8mb4_unicode_ci'