CREATE TABLE `email_group_user` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email_group_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_on_email_group_id_and_user_id` (`email_group_id`,`user_id`) USING BTREE,
  KEY `idx_email_group_id` (`email_group_id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  CONSTRAINT `cst_email_group_user_ibfk_1` FOREIGN KEY (`email_group_id`) REFERENCES `email_group` (`id`),
  CONSTRAINT `cst_email_group_user_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC