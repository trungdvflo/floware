CREATE FUNCTION `f2023_updateUserProcessInvalidDataV2`(pnID              BIGINT(20)
,pnUserId          BIGINT(20)
,pvEmail           VARCHAR(255)
,pnObjScanned      TINYINT(1) -- UPDATE after scan success
,pnEmailScanned    TINYINT(1) -- UPDATE after scan success
,pnObjScanning     TINYINT(1) -- UPDATE BEFORE start scan
,pnEmailScanning   TINYINT(1) -- UPDATE BEFORE start scan
) RETURNS BIGINT(20)
BEGIN
  -- this function UPDATE cleanning process
  -- this function RETURN id of upil record
  DECLARE nUserId           BIGINT(20) DEFAULT pnUserID;
  DECLARE nID               BIGINT(20) DEFAULT pnID;
  --
  IF ifnull(nUserId, 0) = 0 AND ifnull(nID, 0) = 0 THEN
    --
    IF ifnull(pvEmail, 'NA') = 'NA' THEN
      RETURN 0;
    END IF;
    --
    SELECT u.id
      INTO nUserId
      FROM `user` u
     WHERE u.username = pvEmail
       AND u.disabled = 0 -- active userr only
     LIMIT 1;
    --
    IF ifnull(nUserId, 0) = 0 THEN
      RETURN 0;
    END IF;
    --
  END IF;
  --
  SELECT ifnull(max(upil.id), 0)
    INTO nID
    FROM user_process_invalid_link upil
   WHERE upil.user_id  = nUserId
     AND upil.username = ifnull(pvEmail, upil.username);
  --
  IF nID = 0 THEN
    --
    INSERT INTO user_process_invalid_link
            (user_id, username, object_scanning, email_scanning
            ,email_scanned_date, object_scanned_date
            ,created_date, updated_date)
            --
      VALUE (pnUserId, pvEmail, pnObjScanning, pnEmailScanning
            ,IF(ifnull(pnObjScanned, 0) <> 0, unix_timestamp(now(3)), NULL)
            ,IF(ifnull(pnEmailScanned, 0) <> 0, unix_timestamp(now(3)), NULL)
            ,unix_timestamp(now(3))
            ,unix_timestamp(now(3)))
            ON DUPLICATE KEY UPDATE updated_date=VALUES(updated_date)
                                   ,email_scanning=VALUES(email_scanning)
                                   ,object_scanning=VALUES(object_scanning)
                                   ,email_scanned_date=VALUES(email_scanned_date)
                                   ,object_scanned_date=VALUES(object_scanned_date);
    --
    SELECT last_insert_id() INTO nID;
    --
  ELSE
    --
    UPDATE user_process_invalid_link upil
       SET upil.object_scanning        = ifnull(pnObjScanning, upil.object_scanning)
          ,upil.email_scanning         = ifnull(pnEmailScanning, upil.email_scanning)
          ,upil.email_scanned_date     = ifnull(IF(ifnull(pnEmailScanned, 0) <> 0, unix_timestamp(now(3)), NULL), upil.email_scanned_date)
          ,upil.object_scanned_date    = ifnull(IF(ifnull(pnObjScanned, 0) <> 0, unix_timestamp(now(3)), NULL), upil.object_scanned_date)
          ,upil.updated_date        = unix_timestamp(now(3))
     WHERE upil.id                  = nID;
    --
  END IF;
  --
  RETURN nID;
  --
END