CREATE FUNCTION `sort_resetOrderNumberKanban`(nUSERID BIGINT(20)) RETURNS DOUBLE(13,3)
BEGIN
  DECLARE no_more_rows boolean;
  DECLARE nId BIGINT(20);
  DECLARE nCount DECIMAL(20, 10) DEFAULT 0;
  DECLARE nOrderNumber DECIMAL(20, 10);
  DECLARE dUpdatedDate DOUBLE(13,3) DEFAULT UNIX_TIMESTAMP();
  DECLARE kanban_cursor CURSOR FOR
    SELECT k.id 
    FROM kanban k
    WHERE k.user_id = nUSERID
    ORDER BY k.order_number ASC;
  # END of: main script
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
     OPEN kanban_cursor;
     kanban_loop: LOOP
       FETCH kanban_cursor INTO nId;
       -- stop LOOP WHEN no_more_rows
      IF (no_more_rows) THEN
        CLOSE kanban_cursor;
        LEAVE kanban_loop;
      END IF;
       SET nOrderNumber = nCount + lpad(rand(), 13, 0);
       UPDATE kanban k
       SET k.order_number = nOrderNumber
          ,k.order_update_time = (@nReturn := dUpdatedDate + nCount)
          ,k.updated_date = @nReturn
    WHERE k.id = nId
    AND k.user_id = nUSERID;
  SET nCount = nCount + 0.001;
     END LOOP kanban_loop;
    RETURN @nReturn;
END