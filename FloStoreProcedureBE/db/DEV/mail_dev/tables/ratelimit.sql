CREATE TABLE `ratelimit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'sender address (SASL username)',
  `persist` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Do not reset the given quota to the default value after expiry reached.',
  `quota` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'hourly|daily|weekly|monthly recipient quota limit',
  `used` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'current recipient counter',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'when used counter was last updated',
  `expiry` int(10) unsigned DEFAULT '0' COMMENT 'expiry (Unix-timestamp) after which the counter gets reset',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_sender` (`sender`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8