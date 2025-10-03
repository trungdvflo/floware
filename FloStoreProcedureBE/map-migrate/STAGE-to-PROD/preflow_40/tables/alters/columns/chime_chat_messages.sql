ALTER TABLE `chime_chat_messages`
ADD COLUMN `migrate_time` double(13,3) NOT NULL DEFAULT '0.000' COMMENT 'create time message from Chime Service' AFTER `user_id`;