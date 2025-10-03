CREATE FUNCTION `cleanup_groupUser`() RETURNS INT(11)
BEGIN
  --
  DECLARE nID              BIGINT(20);
  DECLARE vName            VARCHAR(255);
  DECLARE nGroupID         BIGINT(20);
  DECLARE nRETURN          INT(11);
  DECLARE no_more_rows     boolean;
  DECLARE uta_cursor CURSOR FOR
  -- A. UPDATE TO USE lasted tracking app id
  # Start of: main query
  SELECT gu.id, g.`name`
    FROM group_user gu
    JOIN `group` g ON gu.group_id = g.id;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN uta_cursor;
  usr_loop: LOOP
    --
    FETCH uta_cursor INTO nID, vName;
    --
    IF (no_more_rows) THEN
      CLOSE uta_cursor;
      LEAVE usr_loop;
    END IF;
    # main UPDATE
    SELECT max(ifnull(g.id,0))
      INTO nGroupID
      FROM `group` g
     WHERE g.`name` = vName;
    
    UPDATE group_user gu
       SET gu.group_id = nGroupID
          ,gu.group_name = vName
     WHERE gu.id = nID;
    # main UPDATE
  END LOOP usr_loop;
  -- B. DELETE un-unse GROUP
  SET nRETURN = deduplicate_group();
  -- ADD GROUP name
  --
  SET nRETURN = deduplicate_groupUser();
  --
  SET nRETURN = save_name_for_GroupUser();
  --     
  SET nRETURN = generate_RCU_group(NULL);
  --
  RETURN 1;
END