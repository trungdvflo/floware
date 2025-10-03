CREATE TABLE `subscription_purchase` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `sub_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `description` varchar(500) CHARACTER SET utf8mb4 NOT NULL DEFAULT '',
  `transaction_id` varchar(500) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `receipt_data` text CHARACTER SET utf8mb4 NOT NULL,
  `is_current` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `purchase_type` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `purchase_status` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_on_user_id_and_is_current_and_sub_id` (`user_id`,`is_current`,`sub_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='utf8_unicode_ci'