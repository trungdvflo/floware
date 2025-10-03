CREATE TABLE `cards` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `addressbookid` int(11) unsigned NOT NULL,
  `carddata` longtext CHARACTER SET utf8mb4,
  `uri` varchar(200) CHARACTER SET utf8mb4 DEFAULT NULL,
  `lastmodified` int(11) unsigned DEFAULT NULL,
  `etag` varbinary(32) DEFAULT NULL,
  `size` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `addressbookid` (`addressbookid`),
  KEY `uri` (`uri`),
  FULLTEXT KEY `carddata` (`carddata`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='utf8_unicode_ci'