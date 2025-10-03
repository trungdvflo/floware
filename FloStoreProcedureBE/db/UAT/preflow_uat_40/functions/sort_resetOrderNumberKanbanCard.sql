CREATE FUNCTION `sort_resetOrderNumberKanbanCard`(nUSERID BIGINT(20)) RETURNS DOUBLE(13,3)
BEGIN
  DECLARE no_more_rows boolean;
  DECLARE nId BIGINT(20);
  DECLARE nCount DECIMAL(20, 10) DEFAULT 0;
  DECLARE nOrderNumber DECIMAL(20, 10);
  DECLARE dUpdatedDate DOUBLE(13,3) DEFAULT UNIX_TIMESTAMP();
  DECLARE kanban_card_cursor CURSOR FOR
    SELECT kc.id 
    FROM kanban_card kc
    WHERE kc.user_id = nUSERID
    ORDER BY kc.order_number ASC;
  # END of: main script
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
     OPEN kanban_card_cursor;
     kanban_card_loop: LOOP
       FETCH kanban_card_cursor INTO nId;
       -- stop LOOP WHEN no_more_rows
      IF (no_more_rows) THEN
        CLOSE kanban_card_cursor;
        LEAVE kanban_card_loop;
      END IF;
       SET nOrderNumber = nCount + lpad(rand(), 13, 0);
       UPDATE kanban_card kc
       SET kc.order_number = nOrderNumber
          ,kc.order_update_time = (@nReturn := dUpdatedDate + nCount)
          ,kc.updated_date = @nReturn
    WHERE kc.id = nId
    AND kc.user_id = nUSERID;
  SET nCount = nCount + 0.001;
     END LOOP kanban_card_loop;
    RETURN @nReturn;
END