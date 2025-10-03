CREATE FUNCTION `collection_createNoti`(userId              BIGINT(20)
                                                          ,userEmail           VARCHAR(255)
                                                          ,collectionId        BIGINT(20)
                                                          ,objectUid           VARBINARY(1000)
                                                          ,objectType          VARCHAR(20)
                                                          ,actionTime          DOUBLE(13,3)
                                                          ,updatedDate         DOUBLE(13,3)
                                                          ,vAction             INT(11)
                                                          ,vContent            VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                          ) RETURNS BIGINT(20)
BEGIN
  DECLARE outNotiId          BIGINT(20) DEFAULT 0;
    DECLARE lastModify         INT(11) DEFAULT 0;
    DECLARE nUserId            BIGINT(20);
    DECLARE vUserEmail         VARCHAR(255);
    -- GET content FROM object
    IF ifnull(vContent, '') = '' THEN
      --
      CASE objectType
        WHEN 'URL' THEN
           SELECT u.title 
             INTO vContent 
             FROM url u
            WHERE u.uid = objectUid
            LIMIT 1;
        WHEN 'VTODO' THEN
           SELECT ct.summary
             INTO vContent 
             FROM cal_todo ct 
            WHERE ct.uid = objectUid
            LIMIT 1;
        WHEN 'VEVENT' THEN
           SELECT ce.summary
             INTO vContent 
             FROM cal_event ce 
            WHERE ce.uid = objectUid 
            LIMIT 1;
        WHEN 'VJOURNAL' THEN
           SELECT cn.summary 
             INTO vContent
             FROM cal_note cn
            WHERE cn.uid = objectUid
            LIMIT 1;
  
        ELSE
            SET vContent = ''; 
      END CASE;
      --
    END IF;
    -- END: GET content FROM object
   
    -- INSERT noti 
    INSERT INTO collection_notification
       (user_id, email, collection_id, object_uid, object_type, action, action_time, content, created_date, updated_date)
     VALUES
      (userId, userEmail, collectionId, objectUid, objectType, vAction, actionTime, vContent, updatedDate, updatedDate);
    --
     SET outNotiId = LAST_INSERT_ID();
    -- INSERT user_notification

    RETURN outNotiId;
END