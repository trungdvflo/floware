CREATE PROCEDURE `c2023_removeComment`(nID                   BIGINT(20)
                                                             ,nUserId                BIGINT(20)
                                                             ,nDeleteTime            DOUBLE(13,3))
sp_removeComment: BEGIN
  --
  DECLARE nPermission    TINYINT(1) DEFAULT 0;
  DECLARE nCommentID     BIGINT(20) DEFAULT 0;
  DECLARE nCollectionId  BIGINT(20) DEFAULT 0;
  DECLARE vObjectUid     VARBINARY(1000) DEFAULT 0;
  DECLARE vReturn        VARCHAR(255) DEFAULT 0;
  DECLARE nReturn        INT(11) DEFAULT 0;
  DECLARE nCAID          BIGINT(20) DEFAULT 0;
  DECLARE vEmail         VARCHAR(255) DEFAULT '';
  --
  SELECT cc.id, ca.collection_id, ca.object_uid, ca.id, cc.email
    INTO nCommentID, nCollectionId, vObjectUid, nCAID, vEmail
    FROM collection_comment cc
    JOIN collection_activity ca ON (ca.id = cc.collection_activity_id)
   WHERE cc.id = nID;
  --
  IF ifnull(nCommentID, 0) = 0 THEN
    --
    SELECT 0 id;
    LEAVE sp_removeComment;
    --
  END IF;

  -- 1. CHECK permission
  SET nPermission = c2022_checkPermissionComment(nCommentID, nCollectionId, vObjectUid, nUserId);
  -- only owner comment | owner collection can DELETE
  IF ifnull(nPermission, 0) < 2 THEN
    --
    SELECT IF(nPermission > 0, -3, nPermission) id;
    LEAVE sp_removeComment;
    --
  END IF;
  --   
  IF ifnull(nCommentID, 0) > 0 THEN
    --
    DELETE FROM collection_comment
     WHERE id = nCommentID;
     
    -- 3. save TO deleted item
    IF ifnull(nCollectionId,0) = 0 THEN
      --
      INSERT INTO deleted_item
        (item_id, item_type, user_id,  item_uid, is_recovery, created_date, updated_date)
      value (nID, 'COLLECTION_HISTORY', nUserId,      '',           0,  nDeleteTime, nDeleteTime);
      --
    ELSE
      --
      SELECT co.user_id
        INTO nUserId
        FROM collection co
       WHERE co.id = nCollectionId;
      -- 
      SET nReturn = d2022_generateDeletedItemSharedOmni('COLLECTION_COMMENT', nCollectionId, nID, nDeleteTime, nUserId);
      --
    END IF;
    -- 4. DELETE file_common will done ON worker
    -- 5. DELETE linked_file_common will done ON worker
  END IF;
  --
  SELECT nCommentID id, nCollectionId collection_id;
  --
END