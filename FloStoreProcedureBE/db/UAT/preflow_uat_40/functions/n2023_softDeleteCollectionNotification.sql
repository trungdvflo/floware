CREATE FUNCTION `n2023_softDeleteCollectionNotification`(
pnNotiID            BIGINT(20)
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
  DECLARE nReturn             BIGINT(20) DEFAULT 0;
  DECLARE nID                 BIGINT(20) DEFAULT 0;
  DECLARE nPermission         TINYINT(1) DEFAULT 0;
  -- 0. validate parameters
  IF isnull(pnNotiID) OR isnull(pnUserId) THEN
    -- 
    RETURN -1; -- access denied
    --
  END IF;
  -- 1. CHECK exist collection
  SELECT ifnull(max(cn.collection_id), 0)
    INTO nCollectionID
    FROM collection_notification cn
   WHERE cn.id = pnNotiID;
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
  SET nID = n2023_createUserNotification(pnNotiID, 0, 0, NULL, pnDeletedDate, pnDeletedDate, pnUserID);
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
  value (pnNotiID, 'COLLECTION_NOTIFICATION', pnUserID, '', 0, pnDeletedDate, pnDeletedDate);
  -- 5. CHECK ALL UN deleted -> DELETE CN permantly
  SET nReturn = n2023_checkToPermanentlyDeleteNotification(pnNotiID, nCollectionID);
  --
  RETURN pnNotiID;
  --
END