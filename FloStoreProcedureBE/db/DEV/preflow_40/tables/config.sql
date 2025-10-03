CREATE TABLE `config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `group` varchar(100) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` json NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_on_group_and_key` (`group`,`key`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1