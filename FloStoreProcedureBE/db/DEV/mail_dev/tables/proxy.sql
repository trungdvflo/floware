CREATE TABLE `proxy` (
  `user` varchar(255) NOT NULL,
  `host` varchar(16) DEFAULT NULL,
  `destuser` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1