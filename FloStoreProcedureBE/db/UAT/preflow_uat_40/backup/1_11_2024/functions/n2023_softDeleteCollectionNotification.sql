CREATE FUNCTION `n2023_softDeleteCollectionNotification`(
pnID            BIGINT(20)
,pnUserId       BIGINT(20)
,pnDeletedDate  DOUBLE(13,3)
) RETURNS BIGINT(20)
BEGIN
  -- DELETE notification collection FOR user
  # -3. Collection was NOT found OR trashed
  # -2. NOT shared collection
  # -1. access denied
  --
  DECLARE nCollectionID       BIGINT(20) DEFAULT 0;
  DECLARE nShared             BIGINT(20) DEFAULT 0;
  DECLARE nReturn             BIGINT(20) DEFAULT 0;
  DECLARE nID                 BIGINT(20) DEFAULT 0;
  DECLARE nPermission         TINYINT(1) DEFAULT 0;
  -- 0. validate parameters
  IF isnull(pnID) OR isnull(pnUserId) THEN
    -- 
    RETURN -1; -- access denied
    --
  END IF;
  -- 1. CHECK exist collection
  SELECT ifnull(max(cn.collection_id), 0)
    INTO nCollectionID
    FROM collection_notification cn
   WHERE cn.id = pnID;
  --
  IF nCollectionID = 0 THEN
    -- 
    RETURN -1; -- access denied
    --
  END IF; 
  -- 2. CHECK permission
  SET nPermission = c2023_checkCollectionPermistion(nCollectionID, pnUserId);
  --
  IF nPermission < 1 THEN
    -- 
    RETURN nPermission; -- NOT DELETE
    --
  END IF; 
  -- 3. negative DELETE FOR user notification
  SET nID = n2023_createUserNotification(pnID, 0, NULL, pnDeletedDate, pnDeletedDate, pnUserID);
  -- already deleted
  IF nID < 1 THEN
    --
    RETURN nID;
    --
  END IF;
  -- 4. CREATE deleted item FOR this user
   # main DELETE
  INSERT INTO deleted_item
        (item_id, item_type, user_id, item_uid, is_recovery, created_date, updated_date)
  value (pnID, 'COLLECTION_NOTIFICATION', pnUserID, '', 0, pnDeletedDate, pnDeletedDate);
  -- 5. CHECK ALL UN deleted -> DELETE CN permantly
  SELECT ifnull(max(csm.id), 0)
    INTO nShared
    FROM collection_shared_member csm
    JOIN collection_notification cn ON (cn.collection_id = csm.collection_id)
    LEFT JOIN user_notification un ON cn.id = (un.collection_notification_id)
   WHERE csm.collection_id = nCollectionID
     AND cn.id = pnID
     AND (un.id IS NULL OR un.deleted_date IS NULL);
  --
  IF nShared = 0 THEN
    -- no one care obout this notification any more -> let detele permanently
    SET nReturn = 100; -- n2023_permanentlyDeleteCollectionNotification(pnID, pnUserID);
    --
  END IF;
  --
  RETURN pnID;
  --
END