CREATE TABLE `comment_mention` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `mention_user_id` int(11) NOT NULL COMMENT '@metionText',
  `created_date` double(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` double(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_comment_id` (`comment_id`),
  KEY `idx_user_id` (`mention_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1