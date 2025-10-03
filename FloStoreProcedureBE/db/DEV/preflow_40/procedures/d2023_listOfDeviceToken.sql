CREATE PROCEDURE `d2023_listOfDeviceToken`(pvEmailList      TEXT
                                                             ,voip             TINYINT(1)
                                                             ,pvDeviceType     VARCHAR(255))
d2023_listOfDevice : BEGIN
  --
  -- -1 THEN 'FLO_WEB'
  --  0 THEN 'FLO_INTERNAL'
  --  1 THEN 'FLO_IPAD_QC'
  --  2 THEN 'FLO_IPAD_PROD'
  --  3 THEN 'FLO_IPHONE_QC'
  --  4 THEN 'FLO_IPHONE_DEV'
  --
  DECLARE nCursor       INT DEFAULT 1;
  DECLARE vDelimiter    VARCHAR(1) DEFAULT ',';
  DECLARE pbWeb         TINYINT(1) DEFAULT 0;
  DECLARE vListId       TEXT DEFAULT '';
  --
  SET SESSION group_concat_max_len = 5000;
  --
  IF pvEmailList IS NULL THEN
    --
    LEAVE d2023_listOfDevice;
    --
  END IF;
  --
  SELECT group_concat(u.id)
    INTO vListId
    FROM user u
   WHERE find_in_set(u.username, pvEmailList);
  --
  SET pbWeb = pvDeviceType IS NULL OR find_in_set(-1, pvDeviceType);
  --
 SELECT u.username, dtt.device_token, dtt.device_uid, dtt.device_type, dtt.env_silent, dtt.cert_env
  FROM (
    SELECT -1 device_type, act.device_uid, NULL device_token, act.user_id uid, NULL cert_env, NULL env_silent
      FROM access_token act
     WHERE pbWeb
       AND find_in_set(act.user_id, vListId)
       AND act.app_id = 'e70f1b125cbad944424393cf309efaf0' -- WEB only
       AND ifnull(act.is_revoked, 0) = 0
       AND act.expires_in > FLOOR(UNIX_TIMESTAMP(NOW(3) - INTERVAL 1 hour) * 1000) -- time IN seconds, living & buffer 1h
     UNION ALL
    (SELECT dt.device_type, NULL device_uid, dt.device_token, dt.user_id uid, dt.cert_env, dt.env_silent
      FROM device_token dt
     WHERE find_in_set(dt.user_id, vListId)
       AND find_in_set(dt.device_type, ifnull(pvDeviceType, '0,1,2,3,4,5,6'))
        AND (dt.device_type IN (5,6) -- always GET MAC tokens NOT depend ON VoIP
          OR CASE 
             WHEN ifnull(voip, 0) = 1 
              THEN dt.cert_env IN (2, 3) 
             ELSE dt.cert_env IN (1, 0)
            END)
       -- AND dt.env_silent = 1
       )
   ) dtt
   JOIN user u ON (u.id = dtt.uid)
  WHERE ifnull(u.disabled, 0) = 0
    AND find_in_set(u.id, vListId);
  --
  SET SESSION group_concat_max_len = 1024;
  --
END