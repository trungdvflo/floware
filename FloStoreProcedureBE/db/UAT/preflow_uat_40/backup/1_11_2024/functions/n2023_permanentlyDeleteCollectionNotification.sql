CREATE FUNCTION `n2023_permanentlyDeleteCollectionNotification`(
pnID            BIGINT(20)
,pnUserId       BIGINT(20)
) RETURNS BIGINT(20)
BEGIN
  --
  DECLARE no_more_rows boolean;
   DECLARE nCount INTEGER DEFAULT 0;
   DECLARE nID INTEGER DEFAULT 0;
   DECLARE noti_cursor CURSOR FOR
   # Start of: main script
   SELECT un.id
     FROM user_notification un
     WHERE un.collection_notification_id = pnID
    ORDER BY 1 DESC;
   # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN noti_cursor;
   usr_loop: LOOP
     --
     FETCH noti_cursor INTO nID;
     --
     IF (no_more_rows) THEN
       CLOSE noti_cursor;
       LEAVE usr_loop;
     END IF;
     # main DELETE
     DELETE FROM user_notification WHERE id = nID;
     SET nCount = nCount + 1;
     #
   END LOOP usr_loop;
   --
   DELETE FROM collection_notification WHERE id = pnID;
   --
  RETURN nCount+1;
  --
END