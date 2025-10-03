CREATE FUNCTION `deduplicate_group`() RETURNS INT(11)
BEGIN
  --
  DECLARE nID          BIGINT(20);
  DECLARE no_more_rows boolean;
  DECLARE ta_cursor CURSOR FOR
  # Start of: main query
  SELECT g1.id
  FROM `group` g1
  INNER JOIN `group` g2 
  WHERE g1.id < g2.id 
    AND g1.`name` = g2.`name`
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
    DELETE g 
      FROM `group` g
     WHERE g.id = nID;
    # main UPDATE
  END LOOP usr_loop;
  --
RETURN 1;
END