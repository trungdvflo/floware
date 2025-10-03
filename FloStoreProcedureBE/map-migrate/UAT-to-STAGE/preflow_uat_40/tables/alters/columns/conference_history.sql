ALTER TABLE `conference_history`
ADD COLUMN `conference_meeting_id` bigint(20) NOT NULL DEFAULT '0' AFTER `action_time`;