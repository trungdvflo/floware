CREATE FUNCTION `OTE_generateSystemKanban`(kbName VARCHAR(255)
                                                            ,nUserId BIGINT(20)
                                                            ) RETURNS INT(11)
BEGIN
   DECLARE no_more_rows    boolean;
   DECLARE collectionId    BIGINT(20);
   DECLARE userId          BIGINT(20);
   DECLARE orderNumber     DECIMAL(20,10);
   DECLARE updatedDate     DOUBLE(13,3);
   DECLARE vcolor          VARCHAR(20);
   DECLARE nID             BIGINT(20);
   DECLARE isOwner         TINYINT(1);
   DECLARE nCount          INT(11) DEFAULT 0;
  
   DECLARE kanban_cursor CURSOR FOR
   # Start of: main script
  SELECT kk.collection_id, kk.user_id
          ,kk.updated_date
          ,CASE kbName
             WHEN 'Notifications' 
             THEN IF(kk.ctype <> 3, -92761, IF(
                  kk.ctype = 3 AND kk.is_owner = 1, 
                  (kk.min_order + min2_order) / 2,
                  kk.min_order - (kk.min2_order - kk.min_order)
               ))
             WHEN 'Members' THEN IF(kk.ctype = 3 AND kk.is_owner = 1, 0.5434, -92761)
             WHEN 'Recently Added' THEN 0.89742
             WHEN 'Email' THEN 1
             WHEN 'Events' THEN 2
             WHEN 'ToDo\'s' THEN 3
             WHEN 'Calls' THEN 4.5
             WHEN 'Notes' THEN 5
             WHEN 'Websites' THEN 6
             WHEN 'Contacts' THEN IF(kk.is_owner > 0, 4, -92761)
             WHEN 'Files' THEN IF(kk.is_owner > 0, 7, -92761)
           END order_number
      FROM (SELECT 1 is_owner, c.id collection_id, c.user_id, c.`type` ctype
                 ,ifnull(MAX(k.updated_date), unix_timestamp()) + floor( RAND() * 100000)/1000 AS updated_date
                  ,ifnull(MIN(k.order_number), 0) min_order
                  ,ifnull(substring_index(substring_index(group_concat(k.order_number ORDER BY 1), ',', 2), ',', -1), 0.5) AS min2_order
              -- ,ifnull(group_concat(k.name), '') kanbans_name
         FROM collection c
             LEFT JOIN kanban k ON (c.id = k.collection_id AND (k.kanban_type IS NULL OR k.kanban_type = 1))
        WHERE (nUserId IS NULL OR c.user_id = nUserId)
           -- AND c.id = 7904799
             GROUP BY c.id
             HAVING IFNULL(GROUP_CONCAT(k.name), '') NOT LIKE CONCAT('%', kbName, '%')
            UNION
          SELECT 0 is_owner, csm.collection_id, csm.member_user_id user_id, 3 ctype
                 ,ifnull(MAX(k.updated_date), unix_timestamp()) + floor( RAND() * 100000)/1000 AS updated_date
                  ,ifnull(MIN(k.order_number), 0) min_order
                  ,ifnull(substring_index(substring_index(group_concat(k.order_number ORDER BY 1), ',', 2), ',', -1), 0.5) AS min2_order
            --   ,ifnull(group_concat(k.name), '') kanbans_name
             FROM collection_shared_member csm
             LEFT JOIN kanban k ON (csm.collection_id = k.collection_id AND csm.member_user_id = k.user_id AND (k.kanban_type IS NULL OR k.kanban_type = 1)) -- system list)
        WHERE csm.shared_status = 1
             -- AND csm.collection_id = 7904799
              AND (nUserId IS NULL OR csm.member_user_id = nUserId)
              AND csm.id IS NOT NULL
             GROUP BY csm.id
             HAVING IFNULL(GROUP_CONCAT(k.name), '') NOT LIKE CONCAT('%', kbName, '%')) kk;

   # END of: main script
    DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   SET SESSION group_concat_max_len = 500000;
   --
   OPEN kanban_cursor;
   kanban_loop: LOOP
     --
     FETCH kanban_cursor 
      INTO collectionId, userId, updatedDate, orderNumber;

     --
     IF (no_more_rows) THEN
       CLOSE kanban_cursor;
       LEAVE kanban_loop;
     END IF;
     --
     SET vcolor = CASE kbName
        WHEN 'Notifications'    THEN '#49BB89'
        WHEN 'Contacts'         THEN '#a0867d'
        WHEN 'Calls'            THEN '#49BB89'
        WHEN 'Email'            THEN '#0074b3'
        WHEN 'Events'           THEN '#f94956'
        WHEN 'Files'            THEN '#969696'
        WHEN 'Notes'            THEN '#FFA834'
        WHEN 'Recently Added'   THEN '#007AFF'
        WHEN 'ToDo\'s'          THEN '#7CCD2D'
        WHEN 'Websites'         THEN '#B658DE'
        WHEN 'Members'          THEN '#666666'
     END;
     IF orderNumber <> -92761 THEN
       --
     INSERT INTO kanban (user_id, collection_id, name, color, order_number, archive_status, order_kbitem, order_update_time
       ,show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
     VALUES(userId, collectionId, kbName, vcolor, orderNumber + (floor(RAND() * 10000) / 8972), 0, NULL, updatedDate
       ,0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate)
       ON DUPLICATE KEY UPDATE updated_date = VALUES(updated_date) + 0.001
                              ,order_number = VALUES(order_number) + 0.001123;
       --
       SET nCount = nCount + 1;
       --
     END IF;
    --
   END LOOP kanban_loop;
   --
   SET SESSION group_concat_max_len = 1024;
   --
RETURN nCount;
END