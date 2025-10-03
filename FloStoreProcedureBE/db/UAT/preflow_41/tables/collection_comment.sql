CREATE TABLE `collection_comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `collection_activity_id` bigint(20) NOT NULL DEFAULT '0',
  `user_id` bigint(20) NOT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
  `action` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'value = 0 >> created (default)\nvalue = 1 >> edited',
  `action_time` double(13,3) NOT NULL DEFAULT '0.000',
  `comment` text CHARACTER SET utf8mb4 NOT NULL,
  `is_draft` tinyint(1) NOT NULL DEFAULT '0',
  `parent_id` bigint(20) NOT NULL DEFAULT '0',
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_activity_id` (`collection_activity_id`),
  KEY `idx_updated_date` (`updated_date`),
  KEY `idx_email` (`email`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_date` (`created_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1