CREATE PROCEDURE `collection_moveActivity_v2`(
         collectionActivityId  BIGINT(20)
         ,collectionId            BIGINT(20)
         ,objectUid               VARBINARY(1000)
         ,userId                    BIGINT(20)
         ,userEmail               VARCHAR(255)
         ,content                  VARCHAR(1000)
         ,actionTime             DOUBLE(13,3)
         ,updatedDate          DOUBLE(13,3))
BEGIN
   DECLARE outCollectionId   BIGINT(20) DEFAULT -1;
   DECLARE outObjectHref     VARCHAR(200) DEFAULT '';
   DECLARE outMaxUpdatedDate DOUBLE(13,3) DEFAULT -1;
   DECLARE oldObjectUid     VARBINARY(1000);
   -- 
   DECLARE objectType        VARCHAR(200) DEFAULT '';
   DECLARE calendarUri       VARCHAR(255) DEFAULT '';
   -- 
   DECLARE countMax          BIGINT(20) DEFAULT -1;
   DECLARE recordId          BIGINT(20) DEFAULT -1;
   DECLARE dateItemHistory   DOUBLE(13,3);
   DECLARE dateItemComment   DOUBLE(13,3);
   DECLARE dateStep          DOUBLE(13,3);
   DECLARE vTable            VARCHAR(255);
   DECLARE hasComment        INT DEFAULT 0;
   -- 
   DECLARE no_more_histories     boolean;
   DECLARE history_cursor CURSOR FOR
      (
      SELECT ch.id, 'history' 
      FROM collection_history ch
      WHERE ch.collection_activity_id = collectionActivityId 
      ORDER BY ch.updated_date DESC
      )
      UNION
      (
      SELECT cc.id, 'comment' 
      FROM collection_comment cc  
      WHERE cc.collection_activity_id = collectionActivityId 
      ORDER BY cc.updated_date DESC
      );
   DECLARE CONTINUE HANDLER FOR NOT FOUND SET no_more_histories = TRUE;
   -- 
   SET dateStep = 0.001;
   SET hasComment = 0;
   IF (collectionId = 0) THEN
      -- 
      SELECT
         `Activity`.`collection_id`
         , `Activity`.`object_type`
         , `Activity`.`object_uid`
         , `S`.`omni_cal_id`
         INTO outCollectionId, objectType, oldObjectUid, calendarUri
      FROM `collection_activity` AS `Activity`
      INNER JOIN `setting` AS `S` ON `S`.`user_id` = userId
      WHERE 
         `Activity`.`id` = collectionActivityId 
          AND `Activity`.`user_id` = userId;
      -- 
   ELSE
      -- 
      SELECT
         `Activity`.`collection_id`
         , `Activity`.`object_type`
         , `Activity`.`object_uid`
         , `CO`.`calendar_uri`
         INTO outCollectionId, objectType, oldObjectUid, calendarUri
      FROM `collection_activity` AS `Activity`
      INNER JOIN `collection` AS `CO` 
          ON `CO`.`id` = collectionId 
          AND `CO`.`user_id` = userId 
          AND `CO`.`is_trashed` = 0
      WHERE 
          `Activity`.`id` = collectionActivityId 
          AND `Activity`.`user_id` = userId;
      -- 
   END IF;

   IF ifnull(objectType, '') <> 'URL' THEN
      SET outObjectHref = CONCAT('/calendarserver.php/calendars/', userEmail,'/',calendarUri,'/',objectUid,'.ics');
   END IF;

   IF (outCollectionId >= 0 AND outCollectionId <> collectionId) THEN
      -- IF has activity 
      -- count
      SELECT count(*) INTO countMax 
      FROM collection_history ch 
      WHERE ch.collection_activity_id = collectionActivityId;
      SET outMaxUpdatedDate = updatedDate + (countMax+1)*dateStep;
   
      UPDATE collection_activity ca 
         SET ca.collection_id = collectionId,
            ca.object_uid = objectUid,
            ca.object_href = outObjectHref,
            ca.updated_date = outMaxUpdatedDate
      WHERE 
         ca.id = collectionActivityId 
         AND ca.user_id = userId;
  
     -- CREATE notification 
     CALL collection_createNotiWhenMove_v2 (userId, userEmail, outCollectionId, collectionId, oldObjectUid, objectUid, objectType, content, actionTime, outMaxUpdatedDate);
      -- SELECT out_noti_x_id, out_noti_y_id FROM DUAL;

      -- UPDATE ALL history, comment
      IF (countMax > 0) THEN
        -- IF has history
        OPEN history_cursor;
        SET dateItemHistory = outMaxUpdatedDate;
        SET dateItemComment = outMaxUpdatedDate;
        history_loop: LOOP
        FETCH history_cursor INTO recordId, vTable;
        IF (no_more_histories) THEN
           LEAVE history_loop;
        END IF;
        IF vTable = 'history' THEN
           -- 
           UPDATE collection_history ch 
               SET ch.updated_date = dateItemHistory 
           WHERE ch.id = recordId;
           SET dateItemHistory = dateItemHistory - dateStep;
           -- 
        ELSEIF vTable = 'comment' THEN
           -- 
           UPDATE collection_comment cc 
               SET cc.updated_date = dateItemComment 
           WHERE cc.id = recordId;
           SET dateItemComment = dateItemComment - dateStep;
           SET hasComment = 1;
           -- 
        END IF;
        END LOOP history_loop; 
        CLOSE history_cursor;
        -- 
      END IF;
      -- 
   ELSEIF (outCollectionId >= 0 AND outCollectionId = collectionId) THEN
      -- same collection id
      SET outMaxUpdatedDate = updatedDate;
      -- 
   END IF;
   
   -- RETURN VALUES  
   SELECT 
      hasComment has_comment
      , outCollectionId out_collection_id
      , outObjectHref out_object_href
      , outMaxUpdatedDate out_max_updated_date;
END