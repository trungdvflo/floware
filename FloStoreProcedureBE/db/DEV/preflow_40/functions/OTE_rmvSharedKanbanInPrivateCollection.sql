CREATE FUNCTION `OTE_rmvSharedKanbanInPrivateCollection`() RETURNS INT(11)
BEGIN
 --
  DECLARE nID      BIGINT(20);
  DECLARE nCount   INT(11) DEFAULT 0;
  
  --
  DECLARE no_more_rows boolean;
  DECLARE sysCursor CURSOR FOR
  # Start of: main query
  SELECT k.id -- , k.user_id kuser_id, c.type, c.user_id, k.name
   FROM kanban k 
  JOIN collection c ON (k.collection_id = c.id AND k.user_id = c.user_id)
  WHERE c.type <> 3
  AND k.name IN ('Notifications', 'Members');
  
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN sysCursor;
  usr_loop: LOOP
    --
    FETCH sysCursor INTO nID;
    --
    IF (no_more_rows) THEN
      CLOSE sysCursor;
      LEAVE usr_loop;
    END IF;
    # query TO checking dupplicated
     DELETE FROM kanban WHERE id = nID;
     SET nCount = nCount + 1;
    # main UPDATE
  END LOOP usr_loop;
  --
  RETURN nCount;
END