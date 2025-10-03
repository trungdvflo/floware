CREATE FUNCTION `OTE_migrateSystemCollection`() RETURNS INT(11)
BEGIN
   DECLARE no_more_rows boolean;
   DECLARE userId BIGINT(20);
   DECLARE updatedDate DOUBLE;
   DECLARE system_collection_cursor CURSOR FOR
   # Start of: main script
   SELECT u.id user_id, now()/1000 AS updated_date FROM `user` u 
     LEFT JOIN collection_system cs ON u.id = cs.user_id
     WHERE cs.id IS NULL;
   # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN system_collection_cursor;
   system_collection_loop: LOOP
     --
     FETCH system_collection_cursor INTO userId, updatedDate;
     --
     IF (no_more_rows) THEN
       CLOSE system_collection_cursor;
       LEAVE system_collection_loop;
     END IF;

   INSERT INTO collection_system (user_id, name, type, is_default, created_date, updated_date)
    VALUES
    (userId, 'Email', 1, 1, updatedDate, updatedDate),
    (userId, 'Calendar', 2, 1, updatedDate, updatedDate),
    (userId, 'ToDo\'s', 3, 1, updatedDate, updatedDate),
    (userId, 'Contacts', 4, 1, updatedDate, updatedDate),
    (userId, 'Calls', 10, 1, updatedDate, updatedDate),
    (userId, 'Notes', 5, 1, updatedDate, updatedDate),
    (userId, 'Websites', 6, 1, updatedDate, updatedDate),
    (userId, 'Files', 7, 1, updatedDate, updatedDate),
    (userId, 'Old Notifications', 9, 1, updatedDate, updatedDate),
    (userId, 'Organizer', 8, 1, updatedDate, updatedDate)
   ;     
     --
   END LOOP system_collection_loop;
   --
RETURN 1;
-- RETURN respond;
END