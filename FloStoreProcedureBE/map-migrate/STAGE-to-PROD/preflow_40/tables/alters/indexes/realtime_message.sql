ALTER TABLE `realtime_message`
ADD KEY `realtime_message_external_message_uid_IDX` (`external_message_uid`) USING BTREE;