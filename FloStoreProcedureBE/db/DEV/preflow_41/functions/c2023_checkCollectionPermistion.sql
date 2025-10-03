CREATE FUNCTION `c2023_checkCollectionPermistion`(
 pnCollectionId        BIGINT(20)
,pnUserId              BIGINT(20)
) RETURNS TINYINT(1)
BEGIN
  -- CHECK permisstion be FOR operate ON shared collection
  # -3 Collection was NOT found OR trashed
  # -2. NOT shared collection
  # -1. dont have edit RIGHT: access denied
  #  0. collection NOT joined yet
  #  1. collecton viewer
  #  2.collection editor
  #  3.collection owner
  --
  DECLARE nOwnerID           BIGINT(20);
  DECLARE nIdLink            BIGINT(20);
  DECLARE nShared            TINYINT(1);
  DECLARE nCollectionType    TINYINT(1);
  DECLARE nReturn            TINYINT(1) DEFAULT 0;
  DECLARE nIsTrashed         TINYINT(1);
  -- 0. validate parameters
 IF isnull(pnCollectionId) OR isnull(pnUserId) THEN
   -- 
   RETURN -1; -- access denied
   -- 
 END IF;
 -- 1. GET collection detail
  SELECT ifnull(max(co.user_id), -1), co.`type`, co.is_trashed
    INTO nOwnerID, nCollectionType, nIsTrashed
    FROM collection co
   WHERE co.id = pnCollectionId;
  --
  -- 1.1 IS collection NOT found | trashed?
  IF nOwnerID = -1 OR ifnull(nIsTrashed, 0) > 0 THEN
    -- 
    RETURN -3; -- NOT found
    -- 
  END IF;
  -- 1.2 IS collection owner?
  IF ifnull(nCollectionType, 0) <> 3 THEN
    -- 
    RETURN -2; -- NOT shared
    -- 
  END IF;
  --  2. CHECK permisstion ON this collection
  IF nOwnerID = pnUserId THEN
    -- 
    RETURN 3; -- owner
    -- 
  END IF;
  -- 3. CHECK member joined
  SELECT ifnull(max(csm.access), 0)
    INTO nReturn
    FROM collection_shared_member csm
   WHERE csm.collection_id = pnCollectionId
     AND csm.member_user_id = pnUserId
     AND csm.shared_status = 1; -- joined only
  --
  RETURN nReturn;
  --
END