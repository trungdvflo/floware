CREATE TABLE `collection_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `collection_activity_id` bigint(20) NOT NULL DEFAULT '0',
  `email` varchar(255) NOT NULL DEFAULT '',
  `action` int(11) NOT NULL DEFAULT '0' COMMENT 'he action of the user changes the data of shared objects\n0: created (default )\n1: edited\n2: moved\n3: deleted\n4: completed (mark done) \n5: completed sub-task\n6: commented\n7: approved\n8: changed date\n9: changed time\n1:> changed location\n1:> rejected \n1:> started',
  `action_time` double(13,3) NOT NULL DEFAULT '0.000',
  `assignees` text NOT NULL,
  `content` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'content changes',
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_activity_id` (`collection_activity_id`),
  KEY `idx_email` (`email`),
  KEY `idx_updated_date` (`updated_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1