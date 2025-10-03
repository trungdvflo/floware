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
  SELECT uu.id, uu.username -- group_concat(FROM_UNIXTIME(act.created_date, '%Y-%m-%d %H:%i:%s')), FROM_UNIXTIME(MAX(act.created_date), '%Y-%m-%d %H:%i:%s')
    FROM user uu
    JOIN access_token act ON (uu.id = act.user_id)
LEFT JOIN user_process_invalid_link upil ON (uu.id = upil.user_id)
   WHERE upil.id IS NULL
   GROUP BY uu.id
   ORDER BY MAX(act.created_date) DESC;
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
    -- max scan date | this day
    SELECT ifnull(FROM_UNIXTIME(max(upil.object_scanned_date)), DATE(NOW()))
      INTO maxScanObject
      FROM user_process_invalid_link upil;
    --
    SET timeScanObject = UNIX_TIMESTAMP(maxScanObject + INTERVAL GREATEST((nCount DIV 100), 1) * 60 MINUTE);
    SET timeScanEmail = UNIX_TIMESTAMP(maxScanObject + INTERVAL GREATEST((nCount DIV 100), 1) * 90 MINUTE);
    SET nID = f2023_updateUserProcessInvalidDataV2(NULL, nUserID, vEmail, timeScanObject, timeScanEmail, 0, 0);
    --
    SET nCount = nCount + 1;
    # main UPDATE
  END LOOP usr_loop;
  --
  RETURN nCount;
  --
END