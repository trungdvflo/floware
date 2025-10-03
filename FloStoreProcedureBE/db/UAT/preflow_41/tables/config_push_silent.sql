CREATE TABLE `config_push_silent` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `show_sound` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `show_alert` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Hello Flo User',
  `has_alert` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `interval_stop_push` int(11) NOT NULL DEFAULT '3600',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'