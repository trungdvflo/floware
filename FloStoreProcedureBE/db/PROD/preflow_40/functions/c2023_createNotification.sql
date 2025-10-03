CREATE FUNCTION `c2023_createNotification`(pnUserId             BIGINT(20)
                                                          ,pvUsername            VARCHAR(255)
                                                          ,pnCollectionId        BIGINT(20)
                                                          ,pnCommentId           INT(11)
                                                          ,pvObjectUid           VARBINARY(1000)
                                                          ,pvObjectType          VARCHAR(20)
                                                          ,pnActionTime          DOUBLE(13,3)
                                                          ,pnUpdatedDate         DOUBLE(13,3)
                                                          ,pvAction              INT(11)
                                                          ,pvContent             VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                          ) RETURNS BIGINT(20)
BEGIN
  --
  DECLARE nReturn  BIGINT(20) DEFAULT 0;
  DECLARE vContent VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  
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
      --
    END CASE;
    --
  END IF;
  --
  INSERT INTO collection_notification
    (user_id, email, collection_id, comment_id, object_uid, object_type, 
    `action`, action_time, content, created_date, updated_date)
  VALUES
    (pnUserId, pvUsername, pnCollectionId, pnCommentId, pvObjectUid, pvObjectType, 
    pvAction, pnActionTime, vContent, pnUpdatedDate, pnUpdatedDate);
  --
  SET nReturn = LAST_INSERT_ID();
  --
  RETURN nReturn;
  --
END