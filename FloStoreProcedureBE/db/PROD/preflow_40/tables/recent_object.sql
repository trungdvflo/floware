CREATE TABLE `recent_object` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `account_id` bigint(20) unsigned DEFAULT '0',
  `object_uid` varbinary(1000) NOT NULL,
  `object_type` varbinary(50) NOT NULL,
  `object_href` text COLLATE utf8mb4_unicode_ci,
  `recent_date` double(13,3) DEFAULT '0.000',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_recent_objects_on_user_id_and_uid_and_updated_date` (`user_id`,`object_type`,`updated_date`) USING BTREE,
  KEY `idx_account_id_object_uid` (`account_id`,`object_uid`) USING BTREE,
  KEY `idx_object` (`object_uid`,`object_type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC