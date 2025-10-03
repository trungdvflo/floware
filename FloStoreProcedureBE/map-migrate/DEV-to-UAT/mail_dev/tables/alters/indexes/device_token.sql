ALTER TABLE device_token
ADD KEY `idx_time_send` (`time_sent_silent`),
ADD KEY `idx_time_received` (`time_received_silent`),
ADD KEY `idx_cert_env` (`cert_env`),
ADD KEY `idx_device_type` (`device_type`);