CREATE TABLE `quota` (
  `username` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `bytes` bigint(20) NOT NULL DEFAULT '0',
  `messages` int(11) NOT NULL DEFAULT '0',
  `cal_bytes` bigint(20) NOT NULL DEFAULT '0',
  `card_bytes` bigint(20) NOT NULL DEFAULT '0',
  `file_bytes` bigint(20) NOT NULL DEFAULT '0',
  `num_sent` int(11) NOT NULL DEFAULT '0',
  `file_common_bytes` bigint(20) NOT NULL DEFAULT '0',
  `qa_bytes` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`username`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='utf8_unicode_ci'