CREATE PROCEDURE `f2023_cleanInvalidLinks`(pvObjectUid   VARBINARY(1000)
                                                             ,pvObjectType  VARBINARY(50)
                                                             ,pnUserID      BIGINT(20)
                                                             ,pnOffset      INT
                                                             ,pnLimit       INT)
BEGIN
  --
  DECLARE no_more_rows    boolean;
  DECLARE nUserId         BIGINT(20);  
  DECLARE nID             BIGINT(20);  
  DECLARE nCount          INT DEFAULT 0;
  DECLARE nReturn         INT DEFAULT 0;
  DECLARE nUpdate         INT DEFAULT 0;
  DECLARE vDomain VARCHAR(45) DEFAULT '@flodev.net';
  DECLARE user_cursor CURSOR FOR
  # Start of: main script
   SELECT upil.user_id, upil.id
     FROM user_process_invalid_link upil
    WHERE upil.user_id = ifnull(pnUserID, upil.user_id)
      AND upil.cleaned       = 0 -- NOT clean yet
    LIMIT pnLimit
   offset pnOffset;
  --
  # END of: main script
  /* DECLARE
     EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
      DECLARE vMessage TEXT DEFAULT 'An error has occurred, operation rollbacked AND the STORED PROCEDURE was TERMINATED';
          GET DIAGNOSTICS CONDITION 1 vMessage = MESSAGE_TEXT;
      ROLLBACK;
      SELECT vMessage message;
   END;*/
   --
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN user_cursor;
   user_loop: LOOP
     --
     FETCH user_cursor INTO nUserId, nID;
     --
     IF (no_more_rows) THEN
       CLOSE user_cursor;
       LEAVE user_loop;
     END IF;
     -- 1. clean data
     SET nReturn = nReturn + f2023_cleanInvalidLinks4User(nUserID);
    -- 2. UPDATE process
    SET nUpdate = f2023_updateUserProcessInvalidData(nID, nUserID, NULL, IF(nReturn > 0, 2, 0), 1, NULL, NULL);
     --
     SELECT nCount = nCount + 1;
    --
  END LOOP user_loop;
  --
  SELECT nCount, nReturn, nUpdate;
  --
  COMMIT;
  --
END