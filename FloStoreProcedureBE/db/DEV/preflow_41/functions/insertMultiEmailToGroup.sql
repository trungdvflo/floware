CREATE FUNCTION `insertMultiEmailToGroup`(`pnGroupID` INT(11)
                              ,`pvEmailList` TEXT
                              ,`pvDelimiter` VARCHAR(5)
                                                            ) RETURNS TEXT CHARSET latin1
    READS SQL DATA
    DETERMINISTIC
BEGIN
  --
  DECLARE nCountEmail INTEGER;
  DECLARE nCursor INT DEFAULT 1;
  DECLARE nUID INT(11);
  DECLARE nGUID INT(11);
  DECLARE vEMAIL VARCHAR(255);
  DECLARE vRESULT TEXT DEFAULT '';
  IF INSTR(pvEmailList, pvDelimiter) = 0 THEN
    --
    RETURN '';
    --
  END IF;
  -- email count
  SET nCountEmail = LENGTH(pvEmailList) - LENGTH(REPLACE(pvEmailList, pvDelimiter, '')) + 1;
  -- LOOP throw count
  simple_loop: LOOP
    --
    SET vEMAIL = REPLACE(SUBSTRING(SUBSTRING_INDEX(pvEmailList, pvDelimiter, nCursor),
                       LENGTH(SUBSTRING_INDEX(pvEmailList, pvDelimiter, nCursor -1)) + 1), pvDelimiter, '');
    --
    SELECT u.id
      INTO nUID
      FROM users u
     WHERE u.email = vEMAIL;
  --
  IF nUID > 0 THEN
      -- prevent INSERT imagine user
      SELECT max(ifnull(gu.id, 0))
        INTO nGUID
        FROM groups_users gu
       WHERE gu.group_id = pnGroupID
         AND gu.user_id = nUID;
    --
    IF ifnull(nGUID, 0) = 0 THEN
        -- prevent INSERT DUPLICATE
        INSERT INTO `groups_users`
      (`user_id`,`group_id`,`created_date`,`updated_date`)
      VALUES 
        (nUID, pnGroupID, unix_timestamp(), unix_timestamp());
        SELECT last_insert_id() INTO nGUID;
      --
    END IF;
    --
    END IF;
    --
  SET vRESULT = concat(vRESULT, ';', ifnull(nGUID, 0));
    --
    IF nCursor = nCountEmail THEN
      LEAVE simple_loop;
    END IF;
    SET nCursor = nCursor + 1;
  END LOOP simple_loop;
           
   RETURN vRESULT;
   --
END