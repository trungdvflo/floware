CREATE FUNCTION `collection_checkPermissionComment`(nCommentId           BIGINT(20)
                                                                      ,collectionId         BIGINT(20)
                                                                      ,objectUid            VARBINARY(1000)
                                                                      ,nUserId              BIGINT(20)
                                                                      ) RETURNS TINYINT(1)
BEGIN
  -- CHECK permistion TO comment OR DELETE comment
  DECLARE nOwnerID           BIGINT(20);
  DECLARE nCommentOwner      BIGINT(20);
  DECLARE nShared            TINYINT(1);
  DECLARE nCollectionId      BIGINT(20);
  DECLARE nCollectionType    TINYINT(1);
  DECLARE nReturn            TINYINT(1) DEFAULT 0;
  DECLARE nIsTrashed         TINYINT(1);
  DECLARE vObjectUid         VARBINARY(1000);
  --
  -- CHECK owner comment
    SELECT ifnull(max(cm.id),0), ifnull(max(cm.user_id),0)
      INTO nCommentId, nCommentOwner
      FROM collection_comment cm
      WHERE cm.id = nCommentId;
      
    -- NOT found anything
    IF nCommentId = 0 AND collectionId = 0 AND ifnull(objectUid, '') = '' THEN
      --
      RETURN 0;
      --
    END IF;
    
  SET nCollectionId = ifnull(collectionId, 0);
  IF ncollectionId = 0 OR ifnull(objectUid,'') = '' THEN
    --
    SELECT ca.collection_id, ca.object_uid
      INTO nCollectionId, vObjectUid
      FROM collection_comment cc
      JOIN collection_activity ca ON (cc.collection_activity_id = ca.id)
     WHERE cc.id = nCommentId;
    --
  END IF;
  --
 /* IF ifnull(ncollectionId, 0) = 0 THEN
    -- Collection NOT found
    RETURN -2;
    --
  END IF;*/
  
  SET nReturn = collection_checkPermissionActivity(nCollectionId, ifnull(objectUid, vObjectUid), nUserId);
  --
  IF nReturn > 0 AND nUserId = nCommentOwner THEN
      -- comment owner
      RETURN 2;
      --
  END IF;
  --
  RETURN nReturn;
  --
END