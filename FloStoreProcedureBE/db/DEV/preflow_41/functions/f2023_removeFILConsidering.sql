CREATE FUNCTION `f2023_removeFILConsidering`(pvObjectUid   VARBINARY(1000)
                                                               ,pnUserID      BIGINT(20)
                                                               ,pvEmail       VARCHAR(255)
                                                               ) RETURNS INT(11)
BEGIN
    DECLARE no_more_rows boolean;
    DECLARE nID      BIGINT(20);
    DECLARE nCount   INT(11) DEFAULT 0;
    DECLARE user_cursor CURSOR FOR
    # Start of: main script
    SELECT fil.id
      FROM flo_invalid_link fil
      JOIN user u ON (u.id = fil.user_id)
     WHERE fil.user_id = ifnull(pnUserID, fil.user_id)
       AND u.username = pvEmail
       AND fil.object_uid = pvObjectUid
       AND fil.object_type = 'EMAIL'
       AND fil.considering = 1
       AND fil.deleted_date IS NULL;
    # END of: main script
    
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN user_cursor;
   usr_loop: LOOP 
     -- start LOOP user_cursor
     FETCH user_cursor INTO nID;
     -- stop LOOP WHEN no_more_rows
     IF (no_more_rows) THEN
       CLOSE user_cursor;
       LEAVE usr_loop;
     END IF;
     --
     -- DELETE FROM flo_invalid_link
     -- WHERE id          = nID;
     -- only CHECK every single email exist every 24h
     UPDATE flo_invalid_link fil
        SET fil.considering = -1 -- existed
           ,fil.updated_date = unix_timestamp(now(3))
      WHERE id          = nID;
     --
     SET nCount = nCount + 1;
     --
   END LOOP usr_loop;
   --
RETURN nCount;
END