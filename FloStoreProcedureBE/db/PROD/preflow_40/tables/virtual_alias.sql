CREATE TABLE `virtual_alias` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `domain_id` bigint(20) unsigned NOT NULL,
  `source` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `destination` varchar(9000) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_domain_id` (`domain_id`) USING BTREE,
  KEY `idx_source` (`source`) USING BTREE,
  CONSTRAINT `cst_virtual_domain_by_domain_id` FOREIGN KEY (`domain_id`) REFERENCES `virtual_domain` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='utf8_general_ci'