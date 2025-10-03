ALTER TABLE `report_cached_user`
ADD COLUMN `storage_total` bigint(20) NOT NULL DEFAULT '0' AFTER `storage`;