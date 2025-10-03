CREATE FUNCTION `deduplicate_trackingApp`() RETURNS INT(11)
BEGIN
  --
  DECLARE nID          BIGINT(20);
  DECLARE no_more_rows boolean;
  DECLARE ta_cursor CURSOR FOR
  # Start of: main query
  SELECT t1.id
  FROM tracking_app t1
  INNER JOIN tracking_app t2 
  WHERE t1.id < t2.id 
    AND t1.name = t2.name
    AND t1.app_version = t2.app_version
    AND t1.flo_version = t2.flo_version
    AND t1.build_number = t2.build_number
    GROUP BY 1;
  # END of: main query
   
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN ta_cursor;
  usr_loop: LOOP
    --
    FETCH ta_cursor INTO nID;
    --
    IF (no_more_rows) THEN
      CLOSE ta_cursor;
      LEAVE usr_loop;
    END IF;
    # main UPDATE
    DELETE ta 
      FROM tracking_app ta
     WHERE ta.id = nID;
    # main UPDATE
  END LOOP usr_loop;
  --
RETURN 1;
END