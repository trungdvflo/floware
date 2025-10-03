CREATE TABLE `realtime_user_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(200) NOT NULL,
  `last_time_online` double(13,3) DEFAULT NULL,
  `created_date` double(13,3) DEFAULT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `realtime_user_status_UN` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1