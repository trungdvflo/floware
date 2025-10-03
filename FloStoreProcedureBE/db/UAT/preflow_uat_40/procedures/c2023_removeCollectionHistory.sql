CREATE PROCEDURE `c2023_removeCollectionHistory`(nID                  BIGINT(20)
                                                             ,nUserId               BIGINT(20)
                                                             ,nDeleteTime            DOUBLE(13,3))
sp_removeHistory:BEGIN
  --
  DECLARE nPermission    TINYINT(1) DEFAULT 0;
  DECLARE nIDHistory     BIGINT(20) DEFAULT 0;
  DECLARE nCollectionId  BIGINT(20) DEFAULT 0;
  DECLARE vObjectUid     VARBINARY(1000) DEFAULT 0;
  DECLARE vReturn        VARCHAR(255) DEFAULT 0;
  DECLARE nCAID          BIGINT(20) DEFAULT 0;
  DECLARE nReturn        INT(20) DEFAULT 0;
  DECLARE vEmail         VARCHAR(255) DEFAULT '';
   --
  SELECT ch.id, ca.collection_id, ca.object_uid, ca.id, ch.email
      INTO nIDHistory, nCollectionId, vObjectUid, nCAID, vEmail
      FROM collection_history ch
      JOIN collection_activity ca ON (ca.id = ch.collection_activity_id)
    WHERE ch.id = nID;
  --
  IF ifnull(nIDHistory, 0) = 0 THEN
    --
    SELECT 0 id;
    LEAVE sp_removeHistory;
    --
  END IF;
  -- 1. CHECK permission
  SET nPermission = c2023_checkPermissionHistory(nIDHistory, nCollectionId, vObjectUid, nUserId);
  --
  IF ifnull(nPermission, 0) < 2 THEN
    --
    SELECT (CASE WHEN nPermission < 1 THEN nPermission ELSE -3 END) id;
    LEAVE sp_removeHistory;
    --
  END IF;
  -- 2.
  -- SELECT ch.id, ca.collection_id
  --  INTO nIDHistory, nCollectionId
  --  FROM collection_history ch
  --  JOIN collection_activity ca ON (ca.id = ch.collection_activity_id)
  -- WHERE ch.id = nID;
  --
  IF ifnull(nIDHistory, 0) > 0 THEN
    --
    DELETE FROM collection_history
    WHERE id = nIDHistory;
    -- 3. save TO deleted item
    IF ifnull(nCollectionId, 0) = 0 THEN
      -- omni INSERT only FOR owner
      INSERT INTO deleted_item
        (item_id, item_type, user_id,  item_uid, is_recovery, created_date, updated_date)
      value (nID, 'COLLECTION_HISTORY', nUserId,      '',           0,  nDeleteTime, nDeleteTime);
      --
    ELSE
      -- normal INSERT FOR ALL member IN collection shared
      SELECT co.user_id
        INTO nUserId
        FROM collection co
       WHERE co.id = nCollectionId;
      --
      SET nReturn = d2022_generateDeletedItemSharedOmni('COLLECTION_HISTORY', nCollectionId, nID, nDeleteTime, nUserId);
      --
    END IF;
  END IF;
  
  SELECT nIDHistory id, nCollectionId collection_id;
  --
END