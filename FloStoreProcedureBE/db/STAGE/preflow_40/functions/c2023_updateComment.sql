CREATE FUNCTION `c2023_updateComment`(pnID                  BIGINT(20)
  ,pnUserId              BIGINT(20)
  ,pnActionTime          DOUBLE(13,3)
  ,pvComment             TEXT  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  ,pnUpdatedDate          DOUBLE(13,3)) RETURNS BIGINT(20)
BEGIN
  --
  DECLARE nCommentID    BIGINT(20) DEFAULT 0;
  DECLARE nCollectionId BIGINT(20) DEFAULT 0;
  DECLARE vObjectUid    VARBINARY(1000) DEFAULT '';
  DECLARE vObjectType   VARBINARY(50) DEFAULT '';
  DECLARE nPermission   TINYINT(1) DEFAULT 0;
  DECLARE nCAID         BIGINT(20) DEFAULT 0;
  DECLARE vEmail        VARCHAR(255) DEFAULT '';
  --
  SELECT cc.id, ca.collection_id, ca.object_uid, ca.object_type, ca.id, cc.email
      INTO nCommentID, nCollectionId, vObjectUid, vObjectType, nCAID, vEmail
      FROM collection_comment cc
      JOIN collection_activity ca ON (ca.id = cc.collection_activity_id)
    WHERE cc.id = pnID;
  IF ifnull(nCommentID, 0) = 0 THEN
    --
    RETURN 0;
    --
  END IF;
  --
  SET nPermission = c2022_checkPermissionComment(nCommentID, nCollectionId, vObjectUid, pnUserId);
  -- CHECK permision
  IF ifnull(nPermission, 0) <> 2 THEN
    -- don't allow CHANGE FROM other
    RETURN IF(nPermission > 0, -3, nPermission);
    --
  END IF;
  -- UPDATE WHEN existed
  UPDATE collection_comment cc
     SET cc.`action`     = 1
        ,cc.action_time  = IF(pnActionTime > 0, pnActionTime, cc.action_time)
        ,cc.`comment`    = pvComment
        ,cc.updated_date = pnUpdatedDate
   WHERE cc.id = nCommentID;
  --
  RETURN nCommentID;
  --
END