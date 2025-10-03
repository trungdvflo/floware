CREATE TABLE `collection_card` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `collection_id` bigint(20) unsigned NOT NULL,
  `object_uid` varbinary(1000) DEFAULT NULL,
  `object_type` varbinary(50) NOT NULL,
  `object_href` text COLLATE utf8mb4_unicode_ci,
  `account_id` bigint(20) unsigned DEFAULT '0',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_collection_cards_on_collection_id` (`collection_id`) USING BTREE,
  KEY `idx_collection_cards_on_account_id` (`account_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC