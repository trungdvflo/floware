CREATE FUNCTION `migrateKanbanUAT40`() RETURNS INT(11)
BEGIN
   DECLARE no_more_rows boolean;
   DECLARE collectionId BIGINT(20);
   DECLARE userId BIGINT(20);
   DECLARE orderNumber DECIMAL(20,10);
   DECLARE updatedDate DOUBLE(13,3);
--    DECLARE respond TEXT DEFAULT '';
   DECLARE lastID BIGINT(20);
   DECLARE kanban_cursor CURSOR FOR
   # Start of: main script
  SELECT kk.collection_id, kk.user_id, kk.order_number, kk.updated_date
    FROM (
         SELECT k.collection_id, k.user_id, (IFNULL(MAX(k.order_number), 0) + 1) AS order_number
              , (MAX(k.updated_date) + 0.001) AS updated_date
               , group_concat(k.name) kanbans_name
         FROM kanban k
        WHERE k.kanban_type = 1
--           AND k.collection_id = 288417 AND k.user_id = 44898
        GROUP BY k.collection_id, k.user_id
      ORDER BY 1 DESC) kk
    WHERE kk.kanbans_name NOT LIKE '%Recently Added%';

   # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN kanban_cursor;
   kanban_loop: LOOP
     --
     FETCH kanban_cursor INTO collectionId, userId, orderNumber, updatedDate;
     --
     IF (no_more_rows) THEN
       CLOSE kanban_cursor;
       LEAVE kanban_loop;
     END IF;

   INSERT INTO kanban (user_id, collection_id, name, color, order_number, archive_status, order_kbitem, order_update_time
   , show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
  VALUES(userId, collectionId, 'Recently Added', '#007AFF', orderNumber, 0, NULL, updatedDate
   , 0, 0, 3, 0.000, 1, 0, updatedDate, updatedDate)
  ON DUPLICATE KEY UPDATE order_number = VALUES(order_number) + lpad(rand(), 5, 0);
            
  SELECT LAST_INSERT_ID() INTO lastID;
--   SET respond = CONCAT(respond, ';', lastID); 

     --
   END LOOP kanban_loop;
   --
RETURN 1;
-- RETURN respond;
END