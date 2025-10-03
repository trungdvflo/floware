CREATE FUNCTION `c2023_findMentionUserViaEmail`(pvMentionText   VARCHAR(100)
                                ,pvEmail        VARCHAR(100)
) RETURNS INT(11)
BEGIN
  --
  DECLARE nUserId INT DEFAULT 0;
  DECLARE nReturn INT DEFAULT 0;
  -- 1 find
  SELECT ifnull(max(mu.id), 0)
    INTO nReturn
    FROM mention_user mu
   WHERE mu.email      = pvEmail
     AND mu.mention_text = pvMentionText;
  IF nReturn > 0 THEN
    --
    RETURN nReturn;
    --
  END IF;
  SELECT ifnull(max(uu.id), 0)
    INTO nUserId
    FROM `user` uu
   WHERE uu.username = pvEmail
     AND uu.disabled = 0;
  -- NOT found > inser
  INSERT INTO mention_user
  (mention_text, user_id, email, created_date, updated_date)
 VALUES(pvMentionText, nUserId, pvEmail, unix_timestamp(now(3)), unix_timestamp(now(3)));
  --
  SELECT LAST_INSERT_ID() INTO nReturn;
  --
  RETURN nReturn;
  --
END