CREATE FUNCTION `c2023_createCommentMention`(pvMentionText   VARCHAR(100)
                             ,pvEmail           VARCHAR(100)
                                                     ,pnCommentId      INT(11)
                                                     ,pnUserId         BIGINT(20)
                                                     ,pbFirst           TINYINT(1)) RETURNS INT(11)
BEGIN
  --
  DECLARE nReturn       INT DEFAULT 0;
  DECLARE nCount        INT DEFAULT 0;
  DECLARE nMentionId    INT DEFAULT 0;
  --
  IF ifnull(pbFirst, 0) = 1 THEN
    -- 0. remove old mention
    SET nCount = c2023_removeAllMention(pnCommentId, pnUserId);
    --
  END IF;
  --
  -- 2. find mention_user id & CREATE IF NOT existed
  SET nMentionId   = c2023_findMentionUserViaEmail(pvMentionText, pvEmail);
  -- 3. INSERT comment_mention
  INSERT INTO comment_mention
    (comment_id, mention_user_id, created_date, updated_date)
  VALUES (pnCommentId, nMentionId, unix_timestamp(now(3)), unix_timestamp(now(3)));
  --
  SELECT LAST_INSERT_ID()
  INTO nReturn;
  --
  RETURN nReturn;
  --
END