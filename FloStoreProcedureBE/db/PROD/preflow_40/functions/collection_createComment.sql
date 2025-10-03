CREATE FUNCTION `collection_createComment`(nCollectionId         BIGINT(20)
                                                              ,objectUid            VARBINARY(1000)
                                                              ,objectType           VARBINARY(50)
                                                              ,nUserId              BIGINT(20)
                                                              ,nActionTime           DOUBLE(13,3)
                                                              ,vComment             TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                              ,parentId             BIGINT(20) 
                                                              ,createdDate          DOUBLE(13,3)
                                                              ,updatedDate          DOUBLE(13,3)) RETURNS BIGINT(20)
BEGIN
  --
  DECLARE nCommentID    BIGINT(20) DEFAULT 0;
  DECLARE vobjectUid    VARBINARY(1000) DEFAULT '';
  DECLARE nCAID         BIGINT(20) DEFAULT 0;
  DECLARE vEmail        VARCHAR(255);
  DECLARE nPermission   TINYINT(1);
  --
    SET nPermission = collection_checkPermissionComment(0, nCollectionId, objectUid, nUserId);
  -- CHECK permision
  IF ifnull(nPermission, 0) < 1 THEN
    --
    RETURN nPermission;
    --
  END IF;
  -- ensure GET collection_activity_id success;
  SET nCAID = collection_createCollectionActivity(nCollectionId, objectUid, objectType, createdDate, updatedDate);
  --
    IF ifnull(nCAID, 0) = 0 THEN
      --
      RETURN -9;
      --
  END IF;
  --
  -- INSERT brandnew comment
  SELECT ifnull(u.email, '')
    INTO vEmail
    FROM user u
    WHERE u.id = nUserId
    LIMIT 1;
    --
    INSERT INTO  collection_comment
      (collection_activity_id, email, `action`, action_time, `comment`, user_id, parent_id, created_date, updated_date)
    VALUES
      (nCAID, vEmail, 0, nActionTime, vComment, nUserId, parentId, createdDate, updatedDate)
      ON DUPLICATE KEY UPDATE created_date=VALUES(created_date)+0.001, updated_date=VALUES(updated_date)+0.001;
    #
    SELECT LAST_INSERT_ID() 
    INTO nCommentID;
    -- auto INSERT history
    /*INSERT INTO collection_history
      (`collection_activity_id`, `email`, `action`, `action_time`, `content`, `created_date`, `updated_date`)
    VALUES
      (nCAID, vEmail, 6, nActionTime, '', createdDate, updatedDate)
    ON DUPLICATE KEY UPDATE created_date=VALUES(created_date)+0.001, updated_date=VALUES(updated_date)+0.001;*/
    --
    RETURN ifnull(nCommentID, 0);
--
END