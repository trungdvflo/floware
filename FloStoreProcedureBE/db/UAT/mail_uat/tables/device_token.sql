CREATE TABLE `device_token` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `device_token` varchar(255) NOT NULL DEFAULT '',
  `device_type` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `time_sent_silent` double(13,3) NOT NULL DEFAULT '0.000',
  `time_received_silent` double(13,3) NOT NULL DEFAULT '0.000',
  `status_app_run` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `env_silent` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `device_env` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `cert_env` tinyint(1) unsigned DEFAULT '0',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_device_token` (`device_token`) USING BTREE,
  KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1