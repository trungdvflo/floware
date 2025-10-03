CREATE FUNCTION `OTE_generateSystemKanbanMising`(nUserId BIGINT(20)) RETURNS INT(11)
BEGIN
   DECLARE no_more_rows boolean;
   DECLARE collectionId BIGINT(20);
   DECLARE userId BIGINT(20);
   DECLARE orderNumber DECIMAL(20,10);
   DECLARE updatedDate DOUBLE(13,3);
   DECLARE nID BIGINT(20);
   DECLARE nType BIGINT(20);
   
   DECLARE kanban_cursor CURSOR FOR
   # Start of: main script
   SELECT c.id collection_id, c.user_id
         ,1 order_number
     FROM collection c
     LEFT JOIN kanban k ON (c.id = k.collection_id AND k.kanban_type = 1)
    WHERE c.user_id = CASE WHEN ifnull(nUserId,0) = 0 THEN c.user_id ELSE nUserId END
    GROUP BY c.id
   HAVING count(k.id) < 2
    ORDER BY 1 DESC;
   # END of: main script
    DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
    --
    OPEN kanban_cursor;
    kanban_loop: LOOP
      --
      FETCH kanban_cursor INTO collectionId, userId, orderNumber;
      --
      IF (no_more_rows) THEN
        CLOSE kanban_cursor;
        LEAVE kanban_loop;
      END IF;
      --
      SET updatedDate = unix_timestamp() - floor(RAND() * 100000)/9929;
      --
      SELECT max(k.id)
        INTO nID
        FROM kanban k
       WHERE k.`name` = 'Email'
         AND k.collection_id = collectionId
         AND k.kanban_type = 1
         AND k.user_id = userId;
      --
      IF ifnull(nID, 0) = 0 THEN
        --
        INSERT INTO kanban (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time
                ,show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
        VALUES
        (userId, collectionId, 'Email', '#0074b3', 1.001, 0, NULL, updatedDate + 0.01
        ,0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate + 0.01);
        --
        SET nID = 0;
        --
      END IF;
      --
      SELECT max(k.id)
        INTO nID
        FROM kanban k
        WHERE k.`name` = 'Events'
          AND k.collection_id = collectionId
          AND k.kanban_type = 1
          AND k.user_id = userId;
      --
      IF ifnull(nID, 0) = 0 THEN
        --          
        INSERT INTO kanban (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time
                ,show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
        VALUES 
        (userId, collectionId, 'Events', '#f94956', 2.002, 0, NULL, updatedDate + 0.02
        ,0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate + 0.02);
        --
        SET nID = 0;
        --
      END IF;
      --
      SELECT max(k.id)
        INTO nID
        FROM kanban k
        WHERE k.`name` = 'ToDo\'s'
          AND k.collection_id = collectionId
          AND k.kanban_type = 1
          AND k.user_id = userId;
      --
      IF ifnull(nID, 0) = 0 THEN
        --
        INSERT INTO kanban (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time
                ,show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
        VALUES
        (userId, collectionId, 'ToDo\'s', '#7CCD2D', 3.003, 0, NULL, updatedDate + 0.03
        ,0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate + 0.03);
        --
        SET nID = 0;
        --
      END IF;
      --
      SELECT max(k.id)
        INTO nID
        FROM kanban k
        WHERE k.`name` = 'Contacts'
          AND k.collection_id = collectionId
          AND k.kanban_type = 1
          AND k.user_id = userId;
      --
      IF ifnull(nID, 0) = 0 THEN
        --  
        INSERT INTO kanban (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time
                ,show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
        VALUES
        (userId, collectionId, 'Contacts', '#BB8C7C', 4.004, 0, NULL, updatedDate + 0.04
        ,0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate + 0.04);
        --
        SET nID = 0;
        --
      END IF;
      --
      SELECT max(k.id)
        INTO nID
        FROM kanban k
        WHERE k.`name` = 'Notes'
          AND k.collection_id = collectionId
          AND k.kanban_type = 1
          AND k.user_id = userId;
      --
      IF ifnull(nID, 0) = 0 THEN
        --  
        INSERT INTO kanban (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time
                ,show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
        VALUES
        (userId, collectionId, 'Notes', '#FFA834', 5.005, 0, NULL, updatedDate + 0.05
        ,0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate + 0.05);
        --
        SET nID = 0;
        --
      END IF;
      --
      SELECT max(k.id)
        INTO nID
        FROM kanban k
        WHERE k.`name` = 'Websites'
          AND k.collection_id = collectionId
          AND k.kanban_type = 1
          AND k.user_id = userId;
      --
      IF ifnull(nID, 0) = 0 THEN
        --  
        INSERT INTO kanban (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time
                ,show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
        VALUES
        (userId, collectionId, 'Websites', '#B658DE', 6.006, 0, NULL, updatedDate + 0.06
        ,0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate + 0.06);
        --
        SET nID = 0;
        --
      END IF;
      --
      SELECT max(k.id)
        INTO nID
        FROM kanban k
        WHERE k.`name` = 'Files'
          AND k.collection_id = collectionId
          AND k.kanban_type = 1
          AND k.user_id = userId;
      --
      IF ifnull(nID, 0) = 0 THEN
        --  
        INSERT INTO kanban (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time
                ,show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
        VALUES
        (userId, collectionId, 'Files', '#969696', 7.007, 0, NULL, updatedDate + 0.07
        ,0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate + 0.07);
        --
        SET nID = 0;
        --
      END IF;
      --
      SELECT max(k.id)
        INTO nID
        FROM kanban k
        WHERE k.`name` = 'Recently Added'
          AND k.collection_id = collectionId
          AND k.kanban_type = 1
          AND k.user_id = userId;
      --
      IF ifnull(nID, 0) = 0 THEN
        --  
        INSERT INTO kanban (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time
                ,show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
        VALUES
        (userId, collectionId, 'Recently Added', '#007AFF', 8.008, 0, NULL, updatedDate + 0.08
        ,0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate + 0.08);
      END IF;
    --
  END LOOP kanban_loop;
  --
RETURN 1;
END