CREATE TABLE `deleted_item` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `item_uid` varbinary(1000) DEFAULT NULL,
  `item_type` varbinary(50) NOT NULL DEFAULT '',
  `is_recovery` tinyint(1) unsigned DEFAULT '0',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_updated_date` (`updated_date`),
  KEY `unq_on_user_id_and_item_id_and_item_uid_and_item_type` (`user_id`,`item_id`,`item_uid`,`item_type`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC COMMENT='latin1_swedish_ci'