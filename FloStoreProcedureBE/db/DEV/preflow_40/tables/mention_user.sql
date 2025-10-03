CREATE TABLE `mention_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mention_text` varchar(100) NOT NULL COMMENT '@metionText',
  `user_id` bigint(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_updated_date` (`updated_date`),
  KEY `idx_mention_text_and_email` (`mention_text`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1