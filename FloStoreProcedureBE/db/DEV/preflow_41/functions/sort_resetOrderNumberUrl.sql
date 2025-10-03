CREATE FUNCTION `sort_resetOrderNumberUrl`(nUSERID BIGINT(20)) RETURNS DOUBLE(13,3)
BEGIN
  DECLARE no_more_rows boolean;
  DECLARE nId BIGINT(20);
  DECLARE nCount DECIMAL(20, 10) DEFAULT 0;
  DECLARE nOrderNumber DECIMAL(20, 10);
  DECLARE dUpdatedDate DOUBLE(13,3) DEFAULT UNIX_TIMESTAMP();
  DECLARE url_cursor CURSOR FOR
    SELECT u.id 
    FROM url u
    WHERE u.user_id = nUSERID
    ORDER BY u.order_number ASC;
  # END of: main script
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
     OPEN url_cursor;
     url_loop: LOOP
       FETCH url_cursor INTO nId;
       -- stop LOOP WHEN no_more_rows
      IF (no_more_rows) THEN
        CLOSE url_cursor;
        LEAVE url_loop;
      END IF;
       SET nOrderNumber = nCount + lpad(rand(), 13, 0);
       UPDATE url u
       SET u.order_number = nOrderNumber
          ,u.order_update_time = (@nReturn := dUpdatedDate + nCount)
          ,u.updated_date = @nReturn
    WHERE u.id = nId
    AND u.user_id = nUSERID;
  SET nCount = nCount + 0.001;
     END LOOP url_loop;
    RETURN @nReturn;
END