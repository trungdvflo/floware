CREATE TABLE `realtime_message_attachment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `message_uid` varchar(100) NOT NULL,
  `file_id` int(11) DEFAULT NULL,
  `file_common_id` int(11) DEFAULT NULL,
  `file_type` varchar(10) NOT NULL,
  `size` int(11) NOT NULL,
  `path` text NOT NULL,
  `thumb` text NOT NULL,
  `created_date` double(13,3) DEFAULT NULL,
  `updated_date` double(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1