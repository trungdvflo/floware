CREATE FUNCTION `deduplicate_userTrackingApp`() RETURNS INT(11)
BEGIN
  --
  DECLARE nID          BIGINT(20);
  DECLARE no_more_rows boolean;
  DECLARE ta_cursor CURSOR FOR
  # Start of: main query
   SELECT r1.id
   FROM user_tracking_app r1
   INNER JOIN user_tracking_app r2 
   WHERE r1.id < r2.id 
     AND (r1.user_id = r2.user_id OR r1.username = r2.username)
     AND r1.tracking_app_id = r2.tracking_app_id
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
    DELETE uta 
      FROM user_tracking_app uta
     WHERE uta.id = nID;
    # main UPDATE
  END LOOP usr_loop;
  --
RETURN 1;
END