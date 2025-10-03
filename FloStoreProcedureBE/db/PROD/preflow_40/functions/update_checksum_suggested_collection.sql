CREATE FUNCTION `update_checksum_suggested_collection`() RETURNS INT(11)
BEGIN
  --
  DECLARE no_more_rows boolean;
  DECLARE vValue TEXT;
  DECLARE vChecksum VARCHAR(32);
  DECLARE nID BIGINT(20);
  DECLARE sc_cursor CURSOR FOR
   
  # Start of: main query
  SELECT sc.id, sc.criterion_value, sc.criterion_checksum
    FROM suggested_collection sc;
  # END of: main query
   
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN sc_cursor;
  usr_loop: LOOP
    --
    FETCH sc_cursor INTO nID, vValue, vChecksum;
    --
    IF no_more_rows THEN
      CLOSE sc_cursor;
      LEAVE usr_loop;
    END IF;
    # main UPDATE
    IF ifnull(vChecksum, 'NA') = 'NA' THEN
      --
      UPDATE suggested_collection sc
         SET sc.criterion_checksum = md5(vValue)
       WHERE sc.id = nID;
    --
  END IF;
    # main UPDATE
  END LOOP usr_loop;
  --
  RETURN 1;
END