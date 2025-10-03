CREATE TABLE `sent_mail` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `message_id` text COLLATE utf8mb4_unicode_ci,
  `predicted_next_uid` int(11) DEFAULT NULL,
  `email_subject` text COLLATE utf8mb4_unicode_ci,
  `link_item_id` text COLLATE utf8mb4_unicode_ci,
  `filing_item_id` int(11) DEFAULT NULL,
  `tracking_period` int(11) DEFAULT NULL,
  `sending_status` int(11) DEFAULT NULL,
  `account` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci