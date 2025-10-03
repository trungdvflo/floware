CREATE TABLE `email_group` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `domain_id` bigint(20) unsigned DEFAULT NULL,
  `group_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_group_name` (`group_name`),
  KEY `idx_domain_id` (`domain_id`),
  CONSTRAINT `cst_email_group_ibfk_1` FOREIGN KEY (`domain_id`) REFERENCES `virtual_domain` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8