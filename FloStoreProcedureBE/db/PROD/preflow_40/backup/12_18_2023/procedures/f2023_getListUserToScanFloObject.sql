CREATE PROCEDURE `f2023_getListUserToScanFloObject`(pnInterval    INT
                                                                      ,pnOffset      INT
                                                                      ,pnLimit       INT)
f2023_getListUserToScanFloObject:BEGIN
  --
  DECLARE vDomain           VARCHAR(45) DEFAULT '@flomail.net';
  DECLARE nConsidering      INT(11) DEFAULT 0;
  --
  -- count considering: must be less than 1000 email IN queue
  SELECT count(*)
    INTO nConsidering
    FROM user_process_invalid_link upil
    WHERE upil.object_scanning = 1;
  --
  IF nConsidering >= 1e3 THEN
    --
    LEAVE f2023_getListUserToScanFloObject;
    --
  END IF;
  --
   SELECT u.id user_id, u.username, upil.object_scanned_date
     FROM `user` u
     JOIN user_process_invalid_link upil ON (u.id = upil.user_id)
    WHERE (upil.id IS NULL
       OR upil.object_scanned_date IS NULL
       OR upil.object_scanned_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL pnInterval hour)))
      AND ifnull(upil.object_scanning, 0) = 0
      AND u.disabled           = 0
    ORDER BY u.created_date, u.updated_date DESC
    LIMIT pnLimit
   offset pnOffset;
  --
END