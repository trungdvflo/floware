ALTER TABLE `realtime_message`
ADD COLUMN `external_message_uid` varchar(300) DEFAULT NULL AFTER `uid`,
CHANGE COLUMN uid uid varchar(300) NOT NULL;