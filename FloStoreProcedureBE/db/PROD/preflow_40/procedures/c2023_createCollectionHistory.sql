CREATE PROCEDURE `c2023_createCollectionHistory`(collectionId         BIGINT(20)
                                                              ,objectUid            VARBINARY(1000)
                                                              ,objectHref           TEXT
                                                              ,objectType           VARBINARY(50)
                                                              ,nUserId              BIGINT(20)
                                                              ,nAction              INT(11)
                                                              ,nActionTime          DOUBLE(13,3)
                                                              ,vContent             VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                              ,createdDate          DOUBLE(13,3)
                                                              ,updatedDate          DOUBLE(13,3))
sp_createHistory:BEGIN
  --
  DECLARE nHistoryID    BIGINT(20) DEFAULT 0;
  DECLARE nCAID         BIGINT(20) DEFAULT 0;
  DECLARE vEmail        VARCHAR(255);
  DECLARE nOwnerID      BIGINT(20);
  DECLARE nMemberID     BIGINT(20);
  DECLARE nPermission   TINYINT(1);
  --
  START TRANSACTION;
  -- CHECK permission
  SET nPermission = c2023_checkPermissionHistory(0, collectionId, objectUid, nUserId);
  -- CHECK permision allow acction 13: CREATE trash history
  IF NOT (ifnull(nPermission, 0) = -5 AND nAction = 13) AND ifnull(nPermission, 0) < 1 THEN
    --
    ROLLBACK;
    SELECT nPermission id;
    LEAVE sp_createHistory;
    --
  ELSE
    -- ensure GET collection_activity_id suchess;
    SET nCAID = c2022_createCollectionActivity(collectionId, objectUid, objectType, createdDate, updatedDate);
    --
     IF ifnull(nCAID, 0) = 0 THEN
       --
       ROLLBACK;
       SELECT 0 id;
       LEAVE sp_createHistory;
       --
    END IF;
    -- INSERT brandnew comment
    SELECT ifnull(u.email, '')
      INTO vEmail
      FROM user u
     WHERE u.id = nUserId
     LIMIT 1;
    --
    INSERT INTO collection_history
      (`collection_activity_id`, `email`, `action`, `action_time`, `content`, `created_date`, `updated_date`)
    VALUES
      (nCAID, vEmail, nAction, nActionTime, vContent, createdDate, updatedDate)
    ON DUPLICATE KEY UPDATE created_date=VALUES(created_date)+0.001, updated_date=VALUES(updated_date)+0.001;
    #
    SELECT LAST_INSERT_ID() 
    INTO nHistoryID;
    --
    IF ifnull(nHistoryID, 0) = 0 THEN
      --
      ROLLBACK;
      SELECT 0 id;
      LEAVE sp_createHistory;
      --
    END IF;
    --
    COMMIT;
    --
    -- RETURN value
    SELECT ca.collection_id, ca.object_uid, ca.object_type, ca.object_href
          ,ch.id, ch.collection_activity_id
          ,ch.email, ch.action, ch.action_time
          ,ch.content
          ,ch.created_date, ch.updated_date
          ,co.user_id owner_user_id
          ,csm.calendar_uri member_calendar_uri
          ,csm.shared_email member_email
          ,co.calendar_uri owner_calendar_uri
          ,u.username owner_username
      FROM collection_history ch
      JOIN collection_activity ca ON (ca.id = ch.collection_activity_id)
      JOIN collection co ON (ca.collection_id = co.id)
      LEFT JOIN collection_shared_member csm ON (co.id = csm.collection_id)
      JOIN user u ON (u.id = co.user_id)
     WHERE ch.id = nHistoryID
       AND (co.user_id = nUserId
            OR csm.member_user_id = nUserId)
       AND ca.collection_id = CASE 
                                WHEN ifnull(collectionId, 0) = 0 
                                    THEN ca.collection_id 
                                ELSE collectionId 
                            END
            GROUP BY ch.id;
    --
  END IF;
  --
END