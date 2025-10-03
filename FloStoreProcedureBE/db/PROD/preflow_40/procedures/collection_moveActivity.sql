CREATE PROCEDURE `collection_moveActivity`(
pnCollectionActivityId  BIGINT(20)
,pnCollectionId       BIGINT(20)
,pvObjectUid          VARBINARY(1000)
,pnUserId             BIGINT(20)
,pvUserEmail          VARCHAR(255)
,pvContent            VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
,pnActionTime         DOUBLE(13,3)
,pdUpdatedDate        DOUBLE(13,3))
BEGIN
  --
  DECLARE nCollectionId      BIGINT(20) DEFAULT -1;
  DECLARE vObjectHref        VARCHAR(200) DEFAULT '';
  DECLARE nUpdatedDate       DOUBLE(13,3) DEFAULT -1;
  DECLARE oldObjectUid       VARBINARY(1000);
  DECLARE vObjectType        VARCHAR(200) DEFAULT '';
  DECLARE calendarUri        VARCHAR(255) DEFAULT '';
  DECLARE countMax           BIGINT(20) DEFAULT -1;
  DECLARE nID                BIGINT(20) DEFAULT -1;
  DECLARE nDateItemHistory   DOUBLE(13,3);
  DECLARE nDateItemComment   DOUBLE(13,3);
  DECLARE nDateStep          DOUBLE(13,3);
  DECLARE vTable             VARCHAR(255);
  DECLARE bHasComment        INT DEFAULT 0;
  -- 
  DECLARE no_more_rows     boolean;
  DECLARE activity_cursor CURSOR FOR
  --
  (
  SELECT ch.id, 'history' 
    FROM collection_history ch
   WHERE ch.collection_activity_id = pnCollectionActivityId 
   ORDER BY ch.updated_date DESC
   )
   UNION
  (
  SELECT cc.id, 'comment' 
    FROM collection_comment cc  
   WHERE cc.collection_activity_id = pnCollectionActivityId 
   ORDER BY cc.updated_date DESC
   );
   --
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET no_more_rows = TRUE;
  -- 
  SET nDateStep = 0.001;
  SET bHasComment = 0;
  --
  IF pnCollectionId = 0 THEN
    -- 
    SELECT ca.old_collection_id, ca.object_type, ca.object_uid, st.omni_cal_id
      INTO nCollectionId, vObjectType, oldObjectUid, calendarUri
      FROM collection_activity ca
      JOIN setting AS st ON st.user_id = pnUserId
     WHERE ca.id = pnCollectionActivityId 
       AND ca.user_id = pnUserId;
    -- 
  ELSE
    -- 
    SELECT ca.old_collection_id, ca.object_type, ca.object_uid, co.calendar_uri
      INTO nCollectionId, vObjectType, oldObjectUid, calendarUri
      FROM collection_activity ca
      JOIN `collection` co ON (co.id = pnCollectionId AND co.user_id = pnUserId  AND co.is_trashed = 0)
     WHERE ca.id = pnCollectionActivityId 
       AND ca.user_id = pnUserId;
    -- 
  END IF;
  --
  /*SELECT ca.old_collection_id, ca.object_type, ca.object_uid
         ,CASE pnCollectionId WHEN 0 THEN st.omni_cal_id ELSE co.calendar_uri END
     INTO nCollectionId, vObjectType, oldObjectUid, calendarUri
     FROM collection_activity ca
LEFT JOIN `collection` co ON (co.id = pnCollectionId AND co.user_id = ca.user_id AND co.is_trashed = 0)
LEFT JOIN setting st ON (st.user_id = ca.user_id)
    WHERE ca.id = pnCollectionActivityId 
      AND ca.user_id = pnUserId;*/
  --
  IF ifnull(vObjectType, '') <> 'URL' THEN
    --
    SET vObjectHref = CONCAT('/calendarserver.php/calendars/', pvUserEmail,'/',calendarUri,'/',pvObjectUid,'.ics');
    --
  END IF;
  --
  IF (nCollectionId >= 0 AND nCollectionId <> pnCollectionId) THEN
     -- IF has activity 
     -- count
     SELECT count(*) INTO countMax 
     FROM collection_history ch 
     WHERE ch.collection_activity_id = pnCollectionActivityId;
     SET nUpdatedDate = pdUpdatedDate + (countMax + 1 ) * nDateStep;
  
     UPDATE collection_activity ca 
        SET ca.collection_id = pnCollectionId
           ,ca.old_collection_id = pnCollectionId
           ,ca.object_uid = pvObjectUid
           ,ca.object_href = vObjectHref
           ,ca.updated_date = nUpdatedDate
     WHERE ca.id = pnCollectionActivityId 
       AND ca.user_id = pnUserId;
      -- CREATE notification 
    CALL collection_createNotiWhenMove(pnUserId, pvUserEmail, nCollectionId, pnCollectionId, oldObjectUid, pvObjectUid, vObjectType, pvContent, pnActionTime, nUpdatedDate);
     -- SELECT out_noti_x_id, out_noti_y_id FROM DUAL;
     -- UPDATE ALL history, comment
     IF (countMax > 0) THEN
       -- IF has history
       OPEN activity_cursor;
       SET nDateItemHistory = nUpdatedDate;
       SET nDateItemComment = nUpdatedDate;
       --
       activity_loop: LOOP
       FETCH activity_cursor INTO nID, vTable;
       --
       IF no_more_rows THEN
          LEAVE activity_loop;
       END IF;
       --
       IF vTable = 'history' THEN
          -- 
          UPDATE collection_history ch 
             SET ch.updated_date = nDateItemHistory 
           WHERE ch.id = nID;
          --
          SET nDateItemHistory = nDateItemHistory - nDateStep;
          -- 
       ELSEIF vTable = 'comment' THEN
          -- 
          UPDATE collection_comment cc 
             SET cc.updated_date = nDateItemComment 
           WHERE cc.id = nID;
          --
          SET nDateItemComment = nDateItemComment - nDateStep;
          SET bHasComment = 1;
          -- 
       END IF;
       --
       END LOOP activity_loop; 
       CLOSE activity_cursor;
       -- 
     END IF;
     -- 
  ELSEIF (nCollectionId >= 0 AND nCollectionId = pnCollectionId) THEN
     -- same collection id
     SET nUpdatedDate = pdUpdatedDate;
     -- 
  END IF;
  
  -- RETURN VALUES  
  SELECT bHasComment has_comment
        ,nCollectionId out_collection_id
        ,vObjectHref out_object_href
        ,nUpdatedDate out_max_updated_date;
END