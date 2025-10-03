CREATE TABLE `addressbookchanges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uri` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `synctoken` int(11) unsigned NOT NULL,
  `addressbookid` int(11) unsigned NOT NULL,
  `operation` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `addressbookid_synctoken` (`addressbookid`,`synctoken`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci