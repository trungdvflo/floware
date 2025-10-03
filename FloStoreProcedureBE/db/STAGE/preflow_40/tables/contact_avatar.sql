CREATE TABLE `contact_avatar` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `file_ext` varchar(10) CHARACTER SET utf8 NOT NULL,
  `object_href` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'String, not null',
  `object_uid` varbinary(1000) NOT NULL,
  `size` int(11) NOT NULL COMMENT 'The size of the contact avatar is uploaded',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_object_uid` (`object_uid`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  FULLTEXT KEY `idx_object_href` (`object_href`),
  CONSTRAINT `cst_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC