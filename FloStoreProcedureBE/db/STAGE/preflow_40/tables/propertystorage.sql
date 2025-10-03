CREATE TABLE `propertystorage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `path` varbinary(1024) NOT NULL,
  `name` varbinary(100) NOT NULL,
  `valuetype` int(11) unsigned DEFAULT NULL,
  `value` mediumblob,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `path_property` (`path`,`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC