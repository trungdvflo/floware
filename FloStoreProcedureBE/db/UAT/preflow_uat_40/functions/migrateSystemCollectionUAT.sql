CREATE FUNCTION `migrateSystemCollectionUAT`() RETURNS INT(11)
BEGIN
   DECLARE no_more_rows boolean;
   DECLARE userId BIGINT(20);
   DECLARE updatedDate DOUBLE(13,3);
   DECLARE system_collection_cursor CURSOR FOR
   # Start of: main script
  SELECT cs.user_id, cs.updated_date
    FROM (
         SELECT cs.user_id, (MAX(cs.updated_date) + 0.001) AS updated_date, group_concat(cs.`type`) AS collectionType
         FROM collection_system cs
         WHERE cs.is_default = 1
        GROUP BY cs.user_id) cs
    WHERE cs.collectionType NOT LIKE '%9%';
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
    VALUES(userId, 'Old Notification', 9, 1, updatedDate, updatedDate);     
     --
   END LOOP system_collection_loop;
   --
RETURN 1;
-- RETURN respond;
END