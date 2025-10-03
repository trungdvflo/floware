CREATE FUNCTION `save_name_for_GroupUser`() RETURNS INT(11)
BEGIN
  --
  DECLARE nID          BIGINT(20);
  DECLARE vName        VARCHAR(255);
  DECLARE vUSRNAME     VARCHAR(255);
  DECLARE no_more_rows boolean;
  
   DECLARE gu_cursor CURSOR FOR
  # Start of: main query
  SELECT gu.id, g.`name`, u.email
    FROM group_user gu
    JOIN `group` g ON gu.group_id = g.id
    JOIN `user` u ON gu.user_id = u.id
    GROUP BY 1;
  # END of: main query
   
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN gu_cursor;
  gu_loop: LOOP
    --
    FETCH gu_cursor INTO nID, vName, vUSRNAME;
    --
    IF (no_more_rows) THEN
      CLOSE gu_cursor;
      LEAVE gu_loop;
    END IF;
    # main UPDATE
    UPDATE `group_user` gu
      SET gu.group_name = vName
         ,gu.username = vUSRNAME
     WHERE gu.id = nID;
    # main UPDATE
  END LOOP gu_loop;
  --
RETURN 1;
END