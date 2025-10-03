CREATE FUNCTION `OTE_migrateChannelLastUsed`() RETURNS INT(11)
BEGIN
    DECLARE no_more_rows    boolean;
    DECLARE nCount          INT DEFAULT 0;
    DECLARE nReturn         INT DEFAULT 0;
    DECLARE nUserId         BIGINT(20);
    DECLARE nID             BIGINT(20);
    DECLARE nUpdatedDate    DOUBLE(13,3);
    DECLARE channel_cursor CURSOR FOR
    # Start of: main script;
    SELECT cc.id, cc.updated_date
      FROM conference_channel cc
    --  AND cm.is_creator = 1
      ;
    # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN channel_cursor;
   channel_loop: LOOP
     -- start LOOP channel_cursor
     FETCH channel_cursor 
      INTO nID, nUpdatedDate;
     -- stop LOOP WHEN no_more_rows
     IF (no_more_rows) THEN
       CLOSE channel_cursor;
       LEAVE channel_loop;
     END IF;
     # main UPDATE
     UPDATE conference_channel cc
        SET cc.last_used = nUpdatedDate
      WHERE cc.id = nID;
     --
     -- SET nReturn = m2023_insertAPILastModify('conferencing', nUserId, unix_timestamp(now(3)));
     --
     SET nCount = nCount + 1;
      # main UPDATE
     --
   END LOOP channel_loop;
   --
RETURN nCount;
END