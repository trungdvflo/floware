CREATE TABLE `user_release` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `release_id` bigint(20) unsigned NOT NULL COMMENT 'ID of Flo app release',
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'ID of group, refer to table Groups',
  `username` varchar(255) DEFAULT NULL,
  `created_date` double(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_release_id` (`release_id`),
  CONSTRAINT `cst_release_id` FOREIGN KEY (`release_id`) REFERENCES `release` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4