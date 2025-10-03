CREATE FUNCTION `f2023_removeFILProcessed`(pnUserId BIGINT(20)) RETURNS INT(11)
BEGIN
  --
  DECLARE nID              BIGINT(20);
  DECLARE nUserId          BIGINT(20);
  DECLARE no_more_rows     boolean;
  DECLARE nCount           INT(11) DEFAULT 0;
  DECLARE link_cursor CURSOR FOR
  # Start of: main query
  SELECT fil.id, fil.user_id
    FROM flo_invalid_link fil
   WHERE fil.user_id = pnUserId
     AND fil.deleted_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 25 hour));
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN link_cursor;
  link_loop: LOOP
    --
    FETCH link_cursor 
     INTO nID, nUserId;
    --
    IF (no_more_rows) THEN
      CLOSE link_cursor;
      LEAVE link_loop;
    END IF;
    # main DELETE
    DELETE
      FROM flo_invalid_link
     WHERE user_id = pnUserId
       AND id = nID;
    # main DELETE
    SET nCount = nCount + 1;
  END LOOP link_loop;
  --
  RETURN nCount;
  --
END