CREATE FUNCTION `collection_checkPermissionHistory`(nHistotyId           BIGINT(20)
                                                                      ,collectionId         BIGINT(20)
                                                                      ,objectUid            VARBINARY(1000)
                                                                      ,nUserId              BIGINT(20)
                                                                      ) RETURNS TINYINT(1)
BEGIN
  -- CHECK permistion TO comment OR DELETE comment
  DECLARE nOwnerID           BIGINT(20);
  DECLARE nShared            TINYINT(1);
  DECLARE nCollectionId      BIGINT(20);
  DECLARE nCollectionType    TINYINT(1);
  DECLARE nReturn            TINYINT(1) DEFAULT 0;
  DECLARE nIsTrashed         TINYINT(1);
  --
  -- CHECK owner comment
    SELECT ifnull(max(cm.id),0)
      INTO nHistotyId
      FROM collection_history cm
      WHERE cm.id = nHistotyId;
      
    -- NOT found anything
    IF nHistotyId = 0 AND collectionId = 0 AND ifnull(objectUid, '') = '' THEN
      --
      RETURN 0;
      --
    END IF;
    
  SET nCollectionId = ifnull(collectionId, 0);
  IF ncollectionId = 0 THEN
    --
    SELECT ca.collection_id
      INTO nCollectionId
      FROM collection_history cc
      JOIN collection_activity ca ON (cc.collection_activity_id = ca.id)
     WHERE cc.id = nHistotyId;
    --
  END IF;
  --
  /*IF ifnull(ncollectionId, 0) = 0 THEN
    -- Collection NOT found
    RETURN -2;
    -- 
  END IF;*/
  SET nReturn = collection_checkPermissionActivity(nCollectionId, objectUid, nUserId);
  --
  RETURN nReturn;
  --
END