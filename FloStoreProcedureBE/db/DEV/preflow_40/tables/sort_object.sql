CREATE TABLE `sort_object` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `account_id` bigint(20) unsigned DEFAULT '0',
  `object_uid` varbinary(1000) NOT NULL,
  `object_type` varbinary(50) NOT NULL,
  `object_href` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `order_number` decimal(20,10) DEFAULT '0.0000000000',
  `order_update_time` double(13,3) DEFAULT '0.000',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_object_type` (`object_type`) USING BTREE,
  KEY `idx_on_object_type_and_object_uid` (`object_type`,`object_uid`) USING BTREE,
  KEY `idx_account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1