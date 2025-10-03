CREATE FUNCTION `c2023_createComment`(pnCollectionId         BIGINT(20)
  ,pvObjectUid            VARBINARY(1000)
  ,pvObjectType           VARBINARY(50)
  ,pnUserId              BIGINT(20)
  ,pnActionTime           DOUBLE(13,3)
  ,pvComment             TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  ,pnParentId             BIGINT(20) 
  ,pnCreatedDate          DOUBLE(13,3)
  ,pnUpdatedDate          DOUBLE(13,3)) RETURNS BIGINT(20)
BEGIN
  -- DEPRECATED
  DECLARE nCommentID    BIGINT(20) DEFAULT 0;
  DECLARE nCAID         BIGINT(20) DEFAULT 0;
  DECLARE vEmail        VARCHAR(255);
  DECLARE nPermission   TINYINT(1);
  --
    SET nPermission = c2022_checkPermissionComment(0, pnCollectionId, pvObjectUid, pnUserId);
  -- CHECK permision
  IF ifnull(nPermission, 0) < 1 THEN
    --
    RETURN nPermission;
    --
  END IF;
  -- ensure GET collection_activity_id success;
  SET nCAID = c2022_createCollectionActivity(pnCollectionId, pvObjectUid, pvObjectType, pnCreatedDate, pnUpdatedDate);
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
    WHERE u.id = pnUserId
    LIMIT 1;
    --
    INSERT INTO  collection_comment
      (collection_activity_id, email, `action`, action_time, `comment`, user_id, parent_id, created_date, updated_date)
    VALUES
      (nCAID, vEmail, 0, pnActionTime, pvComment, pnUserId, pnParentId, pnCreatedDate, pnUpdatedDate)
      ON DUPLICATE KEY UPDATE created_date=VALUES(created_date)+0.001, updated_date=VALUES(updated_date)+0.001;
    #
    SELECT LAST_INSERT_ID() 
    INTO nCommentID;
    --
    RETURN ifnull(nCommentID, 0);
--
END