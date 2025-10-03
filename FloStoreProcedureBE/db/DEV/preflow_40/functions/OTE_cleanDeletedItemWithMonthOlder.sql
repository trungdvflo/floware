CREATE FUNCTION `OTE_cleanDeletedItemWithMonthOlder`(pnMonth INT) RETURNS INT(11)
BEGIN
    DECLARE no_more_rows    boolean;
    DECLARE nCount          INT DEFAULT 0;
    DECLARE nReturn         INT DEFAULT 0;
    DECLARE nUserId         BIGINT(20);
    DECLARE nID             BIGINT(20);
    DECLARE channel_cursor CURSOR FOR
    # Start of: main script;
    SELECT di.id, di.user_id
      FROM deleted_item di
     WHERE di.created_date < unix_timestamp(now(0) - INTERVAL pnMonth month)
     LIMIT 100000;
    # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN channel_cursor;
   channel_loop: LOOP
     -- start LOOP channel_cursor
     FETCH channel_cursor 
      INTO nID, nUserId;
     -- stop LOOP WHEN no_more_rows
     IF (no_more_rows) THEN
       CLOSE channel_cursor;
       LEAVE channel_loop;
     END IF;
     # main UPDATE
     DELETE FROM deleted_item
      WHERE id = nID
        AND user_id = nUserId;
     --
     SET nCount = nCount + 1;
      # main UPDATE
     --
   END LOOP channel_loop;
   --
RETURN nCount;
END