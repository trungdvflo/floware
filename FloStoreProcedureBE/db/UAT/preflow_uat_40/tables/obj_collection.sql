CREATE TABLE `obj_collection` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `object_uid` varbinary(1000) NOT NULL,
  `object_type` varbinary(50) NOT NULL,
  `collection_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC COMMENT='latin1_swedish_ci'