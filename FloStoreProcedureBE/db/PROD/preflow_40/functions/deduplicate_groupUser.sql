CREATE FUNCTION `deduplicate_groupUser`() RETURNS INT(11)
BEGIN
  --
  DECLARE nID          BIGINT(20);
  DECLARE no_more_rows boolean;
  DECLARE gu_cursor CURSOR FOR
  # Start of: main query
  SELECT g1.id
  FROM group_user g1
  INNER JOIN group_user g2 
  WHERE g1.id < g2.id 
    AND (g1.group_name = g2.group_name OR g1.group_id = g2.group_id)
      AND (g1.username = g2.username OR g1.user_id = g2.user_id)
    GROUP BY 1;
  # END of: main query
   
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN gu_cursor;
  gu_loop: LOOP
    --
    FETCH gu_cursor INTO nID;
    --
    IF (no_more_rows) THEN
      CLOSE gu_cursor;
      LEAVE gu_loop;
    END IF;
    # main UPDATE
    DELETE g 
      FROM `group_user` g
     WHERE g.id = nID;
    # main UPDATE
  END LOOP gu_loop;
  --
RETURN 1;
END