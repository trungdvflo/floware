CREATE TABLE `collection_instance_member` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'user_id of member',
  `owner_user_id` bigint(20) unsigned NOT NULL COMMENT 'user_id of owner',
  `collection_id` bigint(20) unsigned NOT NULL COMMENT 'ID record of table collection - shared by the owner ',
  `color` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `favorite` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `is_hide` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `recent_time` double(13,3) NOT NULL DEFAULT '0.000',
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_owner_user_id` (`owner_user_id`) USING BTREE,
  KEY `idx_collection_id` (`collection_id`) USING BTREE,
  KEY `idx_updated_date` (`updated_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC