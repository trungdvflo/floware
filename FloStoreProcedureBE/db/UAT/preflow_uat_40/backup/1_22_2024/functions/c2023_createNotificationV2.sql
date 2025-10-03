CREATE FUNCTION `c2023_createNotificationV2`(pnUserId             BIGINT(20)
                                                          ,pvUsername            VARCHAR(255)
                                                          ,pnCollectionId        BIGINT(20)
                                                          ,pnCommentId           INT(11)
                                                          ,pvObjectUid           VARBINARY(1000)
                                                          ,pvObjectType          VARCHAR(20)
                                                          ,pnAction              INT(11)
                                                          ,pnActionTime          DOUBLE(13,3)
                                                          ,pvAssignee            TEXT
                                                          ,pvContent             VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                          ,pnUpdatedDate         DOUBLE(13,3)
                                                          ) RETURNS BIGINT(20)
BEGIN
  --
  DECLARE nReturn  BIGINT(20) DEFAULT 0;
  DECLARE nLastAPI  INT DEFAULT 0;
  DECLARE vContent VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE nHasMention TINYINT(1) DEFAULT 0;
  SET vContent = ifnull(pvContent, '');
  IF vContent = '' THEN
    --
    CASE ifnull(pvObjectType, '')
      --
      WHEN 'URL' THEN
        --
        SELECT ifnull(u.title, '') 
          INTO vContent 
          FROM url u
         WHERE u.uid = pvObjectUid
         LIMIT 1;
        --
      WHEN 'VTODO' THEN
        --
        SELECT ifnull(ct.summary, '')
          INTO vContent 
          FROM cal_todo ct 
         WHERE ct.uid = pvObjectUid
         LIMIT 1;
        --
      WHEN 'VEVENT' THEN
        --
        SELECT ifnull(ce.summary, '')
          INTO vContent 
          FROM cal_event ce 
         WHERE ce.uid = pvObjectUid 
         LIMIT 1;
        --
      WHEN 'VJOURNAL' THEN
        --
        SELECT ifnull(cn.summary, '')
          INTO vContent
          FROM cal_note cn
         WHERE cn.uid = pvObjectUid
         LIMIT 1;
        --
      ELSE
        --
        SET vContent = ''; 
        --
    END CASE;
    --
  END IF;
  --
  IF pnAction = 61 THEN
    --
    SET nHasMention = 1;
    --
  ELSEIF pnAction = 6 THEN
    -- CHECK exist mention TO transform TO 63
    SELECT count(*) > 0
      INTO nHasMention
      FROM comment_mention cm
      WHERE comment_id = pnCommentId;
    --
  END IF;
  --
  INSERT INTO collection_notification
    (user_id, email, collection_id, comment_id, has_mention, object_uid, object_type, 
    `action`, action_time, assignees, content, created_date, updated_date)
  VALUES
    (pnUserId, pvUsername, pnCollectionId
    ,CASE WHEN pnAction IN (6, 61, 62) THEN pnCommentId ELSE 0 END
    ,nHasMention
    ,pvObjectUid, pvObjectType, 
    pnAction, pnActionTime
    ,CASE WHEN pnAction IN (17, 18) THEN ifnull(pvAssignee, '') ELSE '' END
    ,ifnull(vContent, ''), pnUpdatedDate, pnUpdatedDate);
  --
  -- send last modified
  SET nLastAPI = c2022_sendLastModifyShare('collection_activity', pnCollectionId, pnUpdatedDate);
  SET nReturn = LAST_INSERT_ID();
  --
  RETURN nReturn;
  --
END