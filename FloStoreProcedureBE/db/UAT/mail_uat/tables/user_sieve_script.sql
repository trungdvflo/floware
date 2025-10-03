CREATE TABLE `user_sieve_script` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `uid` varchar(64) NOT NULL,
  `script_name` enum('active','keep') DEFAULT 'keep',
  `script_data` text NOT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_on_username_and_script_name` (`username`,`script_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8