ALTER TABLE `chime_chat_messages`
ADD KEY `chime_chat_messages_migrate_time_IDX` (`migrate_time`,`channel_id`) USING BTREE;