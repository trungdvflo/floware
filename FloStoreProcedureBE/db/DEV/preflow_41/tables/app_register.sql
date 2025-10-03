CREATE TABLE `app_register` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `app_reg_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `app_alias` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `email_register` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `app_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='utf8_unicode_ci'