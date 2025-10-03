ALTER TABLE `release`
ADD COLUMN `length_dsym` int(11) NOT NULL COMMENT 'The size of the dsym file is uploaded' AFTER `file_dsym_uid`;