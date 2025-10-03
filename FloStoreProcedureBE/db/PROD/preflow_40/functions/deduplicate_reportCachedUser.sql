CREATE FUNCTION `deduplicate_reportCachedUser`() RETURNS INT(11)
BEGIN
  --
  DECLARE nID          BIGINT(20);
  DECLARE no_more_rows boolean;
  DECLARE ta_cursor CURSOR FOR
  # Start of: main query
   SELECT r1.id
   FROM report_cached_user r1
   INNER JOIN report_cached_user r2 
   WHERE r1.id < r2.id 
     AND r1.email = r2.email
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
    DELETE rcu 
      FROM report_cached_user rcu
     WHERE rcu.id = nID;
    # main UPDATE
  END LOOP usr_loop;
  --
RETURN 1;
END