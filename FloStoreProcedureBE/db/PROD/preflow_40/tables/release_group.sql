CREATE TABLE `release_group` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `release_id` bigint(20) unsigned NOT NULL COMMENT 'ID of Flo app release',
  `group_id` bigint(20) unsigned DEFAULT NULL COMMENT 'The ID of the group, refer to the table "groups"	',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_on_release_id_and_group_id` (`release_id`,`group_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC