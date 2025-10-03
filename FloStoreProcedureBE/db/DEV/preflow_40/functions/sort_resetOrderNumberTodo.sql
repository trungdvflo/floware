CREATE FUNCTION `sort_resetOrderNumberTodo`(nUSERID BIGINT(20)) RETURNS DOUBLE(13,3)
BEGIN
  DECLARE no_more_rows boolean;
  DECLARE nId BIGINT(20);
  DECLARE nCount DECIMAL(20, 10) DEFAULT 0;
  DECLARE nOrderNumber DECIMAL(20, 10);
  DECLARE dUpdatedDate DOUBLE(13,3) DEFAULT UNIX_TIMESTAMP();
  DECLARE todo_cursor CURSOR FOR
    SELECT so.id 
    FROM sort_object so
    WHERE so.user_id = nUSERID
    AND so.object_type = 'VTODO'
    ORDER BY so.order_number ASC;
  # END of: main script
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
     OPEN todo_cursor;
     todo_loop: LOOP
       FETCH todo_cursor INTO nId;
       -- stop LOOP WHEN no_more_rows
      IF (no_more_rows) THEN
        CLOSE todo_cursor;
        LEAVE todo_loop;
      END IF;
       SET nOrderNumber = nCount + lpad(rand(), 13, 0);
       UPDATE sort_object so
       SET so.order_number = nOrderNumber
          ,so.order_update_time = (@nReturn := dUpdatedDate + nCount)
          ,so.updated_date = @nReturn
    WHERE so.id = nId
    AND so.user_id = nUSERID;
  SET nCount = nCount + 0.001;
     END LOOP todo_loop;
    RETURN @nReturn;
END