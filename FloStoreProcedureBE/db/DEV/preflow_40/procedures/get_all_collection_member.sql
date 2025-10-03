CREATE PROCEDURE `get_all_collection_member`(
  IN user_id BIGINT(20),
    IN page_size INT(11),
    IN modified_lt DOUBLE(13,3),
    IN modified_gte DOUBLE(13,3),
    IN min_id BIGINT(20),
    IN ids VARCHAR(512),
    IN fields VARCHAR(512),
    IN remove_deleted TINYINT(1)
)
BEGIN
  DECLARE _orderby VARCHAR(15);
--   IF (ids IS NOT NULL OR ids != '' OR ids != '0') THEN 
--     SET @_ids = ids.split(',');
--   END IF;
  SELECT
    `s`.`shared_status` AS shared_status
    , `s`.`calendar_uri` AS calendar_uri
    , `s`.`access` AS access
    , `u`.`email` AS owner
    , `s`.`calendar_uri` AS calendar_uri
    , `c`.`id` AS id
    , GREATEST(`c`.`updated_date`, `s`.`updated_date`) AS updated_date 
  FROM `collection` `c` 
  INNER JOIN `collection_shared_member` `s` ON `c`.`id` = `s`.`collection_id`  
  INNER JOIN `user` `u` ON `s`.`user_id` = `u`.`id` 
  WHERE 
    `c`.`type` = 3 
    AND `s`.`member_user_id` = user_id 
    -- AND (`c`.`updated_date` >= ? OR `s`.`updated_date` >= ?) 
    AND IF(remove_deleted = 1, `c`.`is_trashed` != 2, `c`.`is_trashed` IN (0,1,2))
    AND IF(min_id >= 0, `c`.`id` > min_id, 1)
    AND IF(ids IS NOT NULL OR ids != '', `c`.`id` IN (ids), 1)
  ORDER BY 
    -- CASE _orderby WHEN 'id' THEN id END ASC,
    CASE _orderby WHEN 'min_id' THEN `c`.`id` END ASC,
    CASE _orderby WHEN 'modified_gte' THEN GREATEST(`c`.`updated_date`, `s`.`updated_date`) END ASC,
    CASE _orderby WHEN 'modified_lt' THEN GREATEST(`c`.`updated_date`, `s`.`updated_date`) END DESC
  LIMIT page_size;
--   SET @_fields = 's.shared_status AS shared_status
--     , s.calendar_uri AS calendar_uri
--     , s.access AS access
--     , u.email AS owner
--     , GREATEST(`c`.`updated_date`, `s`.`updated_date`) AS updated_date
--     ';
--   IF (fields IS NULL OR fields != '') THEN
--     SET @_fields = CONCAT(@_fields, fields);
--   ELSE
--     SET @_fields = CONCAT(@_fields, ', c.id
--       , c.parent_id
--       , c.name
--       , c.color
--       , c.flag
--       , c.due_date
--       , c.is_hide
--       , c.alerts
--       , c.type
--       , c.recent_time
--       , c.kanban_mode
--       , c.is_trashed
--       , c.is_expand
--       , c.view_mode
--       , c.created_date
--     ');
--   END IF;
-- 
--   SET @_where_min_id = '';
--   IF (min_id >= 0) THEN
--     SET @_where_min_id = CONCAT(' AND `c`.`id` > ', min_id);
--   END IF;
--   SET @_where_ids = '';
--   IF (ids IS NOT NULL OR ids != '' OR ids != '0') THEN
--     SET @_where_ids = CONCAT(' AND `c`.`id` IN (', ids, ')');
--   END IF;
--   SET @_where_modified_lt = '';
--   IF (modified_lt >= 0) THEN
--     SET @_where_modified_lt = CONCAT(' AND `c`.`updated_date` < ', modified_lt, ' AND `s`.`updated_date` < ', modified_lt);
--   END IF;
--   SET @_where_modified_gte = '';
--   IF (modified_gte >= 0) THEN
--     SET @_where_modified_gte = CONCAT(' AND `c`.`updated_date` >= ', modified_gte, ' AND `s`.`updated_date` >= ', modified_gte);
--   END IF;
--   SET @_where_remove_deleted = '';
--   IF (remove_deleted = 1) THEN
--     SET @_where_remove_deleted = ' AND `c`.`is_trashed` != 2';
--   END IF;
--     SET @_where = CONCAT(' WHERE 
--     `c`.`type` = 3 
--     AND `s`.`member_user_id` = ', user_id
--     , @_where_min_id
--     , @_where_ids
--     , @_where_modified_lt
--     , @_where_modified_gte
--     , @_where_remove_deleted
--   );
-- 
--   SET @_order_by = '';
--   IF (min_id >=0 ) THEN
--     SET @_orderby = ' ORDER BY id ASC';
--   END IF;
--   IF (modified_gte >=0 ) THEN
--     SET @_orderby = ' ORDER BY updated_date ASC';
--   END IF;
--   IF (modified_lt >=0 ) THEN
--     SET @_orderby = ' ORDER BY updated_date DESC';
--   END IF;
-- 
--   SET @_sql = CONCAT('SELECT ', @_fields,
--   ' FROM `collection` `c` 
--   INNER JOIN `collection_shared_member` `s` ON `c`.`id` = `s`.`collection_id`  
--   INNER JOIN `user` `u` ON `s`.`user_id` = `u`.`id`'
--   , @_where
--   , @_order_by
--   , ' LIMIT ', page_size
--     );
--     PREPARE stmt FROM @_sql;
--     EXECUTE stmt;
--     DEALLOCATE PREPARE stmt;

END