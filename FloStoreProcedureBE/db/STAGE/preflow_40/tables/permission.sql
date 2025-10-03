CREATE TABLE `permission` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `feature_id` int(11) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `permission_value` int(11) DEFAULT NULL COMMENT 'sum of total permistion granted',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1