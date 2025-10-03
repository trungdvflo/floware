CREATE TABLE `group` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `group_type` enum('0','1','2') COLLATE utf8_unicode_ci DEFAULT '0' COMMENT '0 - PO create\n1 - Lead create\n2 - Internal user',
  `internal_group` enum('0','1','2','3','4','5','6') COLLATE utf8_unicode_ci NOT NULL DEFAULT '0' COMMENT '1 - add to web test group\\\\n2 - add to mac test group\\\\n3 - add to iphone test group\\\\n4 - add to ipad test group\\\\n5 - add to qa test group\\\\n6 - add to auto test group',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_name_type_internal` (`name`,`group_type`,`internal_group`) USING BTREE,
  KEY `idx_group_type` (`group_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC