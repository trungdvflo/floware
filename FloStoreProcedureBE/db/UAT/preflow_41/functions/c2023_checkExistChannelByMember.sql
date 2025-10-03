CREATE FUNCTION `c2023_checkExistChannelByMember`(pnChannelId  BIGINT(20)
                                                                    ,pnUserId     BIGINT(20)) RETURNS INT(11)
BEGIN
  --
  DECLARE nReturn TINYINT(1) DEFAULT 0;
  --
  IF pnChannelId = 0 THEN 
    --
    RETURN nReturn;
    --
  END IF;
  SELECT ifnull(cc.id, 0) > 0
    INTO nReturn
    FROM conference_channel cc
    JOIN conference_member cm ON (cc.id = cm.channel_id)
   WHERE cc.id = pnChannelId
     AND cm.user_id = pnUserId;
  --
  RETURN nReturn;
  --
END