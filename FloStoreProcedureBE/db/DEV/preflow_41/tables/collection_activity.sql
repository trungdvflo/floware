CREATE TABLE `collection_activity` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `collection_id` bigint(20) NOT NULL DEFAULT '0',
  `old_collection_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL DEFAULT '0',
  `object_uid` varbinary(1000) NOT NULL,
  `object_type` varbinary(50) NOT NULL,
  `object_href` text NOT NULL,
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_collection_id` (`collection_id`),
  KEY `idx_updated_date` (`updated_date`),
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_on_obj_uid_and_obj_type_and_collection_id` (`object_uid`,`object_type`,`collection_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1