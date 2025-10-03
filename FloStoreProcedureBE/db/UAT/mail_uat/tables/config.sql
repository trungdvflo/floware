CREATE TABLE `config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `group` varchar(100) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` json NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_on_group_and_key` (`group`,`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1