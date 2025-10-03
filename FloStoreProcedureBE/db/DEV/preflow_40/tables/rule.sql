CREATE TABLE `rule` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `match_type` tinyint(1) unsigned NOT NULL COMMENT '- 0: Match all  - 1: Match any',
  `order_number` decimal(20,10) NOT NULL DEFAULT '0.0000000000' COMMENT 'Order of rule	',
  `is_enable` tinyint(1) unsigned DEFAULT '1' COMMENT '- 0: Disable\n- 1: Enable',
  `is_trashed` tinyint(4) NOT NULL DEFAULT '0',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  `conditions` json NOT NULL,
  `destinations` json NOT NULL,
  `account_id` bigint(20) unsigned DEFAULT '0',
  `apply_all` tinyint(1) unsigned DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_id_and_order_number` (`user_id`,`order_number`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4