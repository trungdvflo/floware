CREATE TABLE `protect_page` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `verify_code` text COLLATE utf8_unicode_ci NOT NULL,
  `checksum` varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'MD5 of verify_code',
  `time_code_expire` int(11) NOT NULL DEFAULT '0',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='utf8_unicode_ci'