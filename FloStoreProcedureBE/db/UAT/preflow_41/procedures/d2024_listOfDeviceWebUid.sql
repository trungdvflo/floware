CREATE PROCEDURE `d2024_listOfDeviceWebUid`(pvEmailList      TEXT)
d2024_listOfDeviceWebUid : BEGIN
  -- GET ALL device uid FOR CALL TO web supply FOR CASE web has NOT enable realtime
  -- 
  DECLARE nCursor       INT DEFAULT 1;
  --
  IF pvEmailList IS NULL THEN
    --
    LEAVE d2024_listOfDeviceWebUid;
    --
  END IF;
  --
 SELECT u.username, act.device_uid
   FROM access_token act
   JOIN user u ON (u.id = act.user_id)
  WHERE find_in_set(u.username, pvEmailList)
    AND ifnull(u.disabled, 0) = 0
    AND act.app_id = 'e70f1b125cbad944424393cf309efaf0' -- WEB only
    AND ifnull(act.is_revoked, 0) = 0
    AND act.expires_in > FLOOR(UNIX_TIMESTAMP(NOW(3) - INTERVAL 1 hour) * 1000) -- time IN seconds, living & buffer 1h
    ;
  --
END