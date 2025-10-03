CREATE FUNCTION `collection_updateComment`(nID                  BIGINT(20)
                                                              ,nUserId              BIGINT(20)
                                                              ,nActionTime           DOUBLE(13,3)
                                                              ,vComment             TEXT  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                              ,updatedDate          DOUBLE(13,3)) RETURNS BIGINT(20)
BEGIN
  --
  DECLARE nCommentID    BIGINT(20) DEFAULT 0;
  DECLARE nCollectionId BIGINT(20) DEFAULT 0;
  DECLARE vobjectUid    VARBINARY(1000) DEFAULT '';
  DECLARE objectType    VARBINARY(50) DEFAULT '';
  DECLARE nPermission   TINYINT(1) DEFAULT 0;
  DECLARE nCAID         BIGINT(20) DEFAULT 0;
  DECLARE vEmail        VARCHAR(255) DEFAULT '';
  --
  SELECT cc.id, ca.collection_id, ca.object_uid, ca.object_type, ca.id, cc.email
      INTO nCommentID, nCollectionId, vObjectUid, objectType, nCAID, vEmail
      FROM collection_comment cc
      JOIN collection_activity ca ON (ca.id = cc.collection_activity_id)
    WHERE cc.id = nID;
  IF ifnull(nCommentID, 0) = 0 THEN
    --
    RETURN 0;
    --
  END IF;
  --
  SET nPermission = collection_checkPermissionComment(nCommentID, nCollectionId, vObjectUid, nUserId);
  -- CHECK permision
  IF ifnull(nPermission, 0) <> 2 THEN
    -- don't allow CHANGE FROM other
    RETURN IF(nPermission > 0, -3, nPermission);
    --
  END IF;
  -- UPDATE WHEN existed
  UPDATE collection_comment cc
     SET cc.`action`     = 1
        ,cc.action_time  = IF(nActionTime > 0, nActionTime, cc.action_time)
        ,cc.`comment`    = vComment
        ,cc.updated_date = updatedDate
   WHERE cc.id = nCommentID;
  -- auto INSERT history
  /*INSERT INTO collection_history
    (`collection_activity_id`, `email`, `action`, `action_time`, `content`, `created_date`, `updated_date`)
  VALUES
    (nCAID, vEmail, 61, updatedDate, '', updatedDate, updatedDate)
  ON DUPLICATE KEY UPDATE created_date=VALUES(created_date)+0.001, updated_date=VALUES(updated_date)+0.001;*/
  --
  RETURN nCommentID;
  --
END