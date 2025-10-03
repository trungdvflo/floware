CREATE FUNCTION `sort_resetOrderNumberCloud`(nUSERID BIGINT(20)) RETURNS DOUBLE(13,3)
BEGIN
  DECLARE no_more_rows boolean;
  DECLARE nId BIGINT(20);
  DECLARE nCount DECIMAL(20, 10) DEFAULT 0;
  DECLARE nOrderNumber DECIMAL(20, 10);
  DECLARE dUpdatedDate DOUBLE(13,3) DEFAULT UNIX_TIMESTAMP();
  DECLARE cloud_cursor CURSOR FOR
    SELECT c.id 
    FROM cloud c
    WHERE c.user_id = nUSERID
    ORDER BY c.order_number ASC;
  # END of: main script
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
     OPEN cloud_cursor;
     cloud_loop: LOOP
       FETCH cloud_cursor INTO nId;
       -- stop LOOP WHEN no_more_rows
      IF (no_more_rows) THEN
        CLOSE cloud_cursor;
        LEAVE cloud_loop;
      END IF;
       SET nOrderNumber = nCount + lpad(rand(), 13, 0);
       UPDATE cloud c
       SET c.order_number = nOrderNumber
          ,c.order_update_time = (@nReturn := dUpdatedDate + nCount)
          ,c.updated_date = @nReturn
    WHERE c.id = nId
    AND c.user_id = nUSERID;
  SET nCount = nCount + 0.001;
     END LOOP cloud_loop;
    RETURN @nReturn;
END