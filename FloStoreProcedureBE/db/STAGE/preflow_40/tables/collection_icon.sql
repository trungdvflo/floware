CREATE TABLE `collection_icon` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shortcut` varchar(255) CHARACTER SET utf8mb4 NOT NULL DEFAULT '',
  `created_date` double(13,3) NOT NULL,
  `updated_date` double(13,3) NOT NULL,
  `cdn_url` text NOT NULL,
  `icon_type` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'icon_type: the type of the icon\\n\\nvalue  = 0 >> activity (default )\\n\\nvalue = 1 >> travel and place\\n\\nvalue = 2 >> objects ',
  `description` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_shortcut` (`shortcut`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='latin1_swedish_ci'