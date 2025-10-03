CREATE TABLE `os_version` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `os_name` varchar(255) DEFAULT NULL,
  `os_version` varchar(100) DEFAULT NULL,
  `os_type` tinyint(1) unsigned DEFAULT '0' COMMENT 'int: 0 = mac (default ), 1 = window, 2 = ubuntu',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_on_os_type_and_os_version` (`os_type`,`os_version`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC