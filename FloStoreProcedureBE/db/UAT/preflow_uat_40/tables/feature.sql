CREATE TABLE `feature` (
  `id` bigint(20) NOT NULL,
  `method` varchar(100) NOT NULL,
  `api_name` varchar(255) NOT NULL,
  `endpoint` text NOT NULL,
  `parent_id` bigint(20) NOT NULL DEFAULT '0' COMMENT 'same with group of permistions, can be group of 5-10',
  `permission_value` int(11) NOT NULL,
  `order_number` double(13,3) NOT NULL,
  `created_by` varchar(100) DEFAULT NULL COMMENT 'email of creator',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_name_method` (`api_name`,`method`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1