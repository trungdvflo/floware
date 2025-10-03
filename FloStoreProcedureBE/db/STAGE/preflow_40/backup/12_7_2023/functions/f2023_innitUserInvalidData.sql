CREATE FUNCTION `f2023_innitUserInvalidData`() RETURNS INT(11)
BEGIN
  --
  DECLARE nID              BIGINT(20);
  DECLARE nUserID          BIGINT(20);
  DECLARE vEmail           VARCHAR(100);
  DECLARE maxScanObject    datetime;
  DECLARE timeScanObject   DOUBLE(13,3);
  DECLARE timeScanEmail    DOUBLE(13,3);
  DECLARE no_more_rows     boolean;
  DECLARE nCount           INT(11) DEFAULT 0;
  DECLARE usr_cursor CURSOR FOR
  # Start of: main query
  SELECT uu.id, uu.username
    FROM user uu
LEFT JOIN user_process_invalid_link upil ON (uu.id = upil.user_id)
   WHERE upil.id IS NULL;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN usr_cursor;
  usr_loop: LOOP
    --
    FETCH usr_cursor INTO nUserID, vEmail;
    --
    IF (no_more_rows) THEN
      CLOSE usr_cursor;
      LEAVE usr_loop;
    END IF;
    # main UPDATE
    
    IF isnull(maxScanObject) THEN
      --
      SELECT ifnull(FROM_UNIXTIME(max(upil.object_scan_date)), DATE(NOW()))
        INTO maxScanObject
        FROM user_process_invalid_link upil;
      --
    END IF;
    
    SET timeScanObject = UNIX_TIMESTAMP(maxScanObject + INTERVAL GREATEST((nCount DIV 100), 1) * 30 MINUTE);
    SET timeScanEmail = UNIX_TIMESTAMP(maxScanObject + INTERVAL GREATEST((nCount DIV 100), 1) * 45 MINUTE);
    SET nID = f2023_updateUserProcessInvalidDataV2(NULL, nUserID, pvEmail, timeScanObject, timeScanEmail, 0, 0);
    --
    SET nCount = nCount + 1;
    # main UPDATE
  END LOOP usr_loop;
  --
  RETURN nCount;
  --
END