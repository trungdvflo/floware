CREATE TABLE `subscription_detail` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sub_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `com_id` int(11) NOT NULL DEFAULT '0',
  `sub_value` int(11) NOT NULL DEFAULT '0',
  `description` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='utf8_unicode_ci'