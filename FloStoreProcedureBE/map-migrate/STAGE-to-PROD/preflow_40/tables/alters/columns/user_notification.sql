ALTER TABLE `user_notification`
ADD COLUMN `has_mention` tinyint(1) NOT NULL DEFAULT '0' AFTER `status`,
CHANGE COLUMN action_time action_time double(13,3) NOT NULL DEFAULT '0.000';