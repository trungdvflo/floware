CREATE TABLE `user_notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT 'User id of member or owner collection',
  `collection_notification_id` bigint(20) NOT NULL DEFAULT '0',
  `status` tinyint(2) NOT NULL DEFAULT '0' COMMENT 'show/hide/archive/trash...',
  `has_mention` tinyint(1) NOT NULL DEFAULT '0',
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  `action_time` double(13,3) NOT NULL DEFAULT '0.000',
  `deleted_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notification_id` (`collection_notification_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_deleted_date` (`deleted_date`),
  KEY `idx_updated_date` (`updated_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1