CREATE TABLE `ad_setting_sub` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `notice_by_email` tinyint(4) NOT NULL DEFAULT '1',
  `notice_by_push` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='utf8_unicode_ci'