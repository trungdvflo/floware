CREATE FUNCTION `c2022_checkPermissionActivity`(nCollectionId        BIGINT(20)
                                                                       ,vObjectUid           VARBINARY(1000)
                                                                       ,nUserId              BIGINT(20)
                                                                       ) RETURNS TINYINT(1)
BEGIN
  -- CHECK permisstion TO comment OR DELETE comment
  # -5 Object was trashed
  # -4 Collection was trashed
  # -3. NOT allow CHANGE comment FROM the other
  # -2. dont have edit RIGHT: access denied
  # -1. NOT shared collection
  #  0. CREATE | NOT found comment fail
  #  1. allow comment
  #  2. owner of the comment allow UPDATE, DELETE comment
  #  3. collection owner, collection editor permission
  --
  DECLARE nOwnerID           BIGINT(20);
  DECLARE nCommentOwner      BIGINT(20);
  DECLARE nIdLink            BIGINT(20);
  DECLARE nShared            TINYINT(1);
  DECLARE nCollectionType    TINYINT(1);
  DECLARE nReturn            TINYINT(1) DEFAULT 0;
  DECLARE nIsTrashed         TINYINT(1);
  -- 0. collection id = 0 aka omni
  IF ifnull(nCollectionId, 0) = 0 THEN
    --
    SELECT max(ca.user_id)
      INTO nOwnerID
      FROM collection_activity ca
      WHERE ca.object_uid = vObjectUid;
    IF ifnull(nOwnerID, 0) = ifnull(nUserId, -1) THEN
      --
      RETURN 3;
      --
    END IF;
    --
  END IF;
  -- 1.
  SELECT ifnull(max(co.user_id), -4), co.`type`, co.is_trashed
    INTO nOwnerID, nCollectionType, nIsTrashed
    FROM collection co
   WHERE co.id = nCollectionId;
  --
    -- 1.1 ..collection DELETE | trashed
  IF nOwnerID = -4 OR ifnull(nIsTrashed, 0) > 0 THEN
    -- NOT shared collection
    RETURN -4;
    --
  END IF;
  -- 1.2 CHECK collection owner
  IF ifnull(nCollectionType, 0) <> 3 THEN
    -- NOT shared collection
    RETURN -1;
    --
  END IF;
  IF ifnull(vObjectUid, '') <> '' THEN
    -- 2. CHECK object trashed?
    SELECT tc.id
      INTO nIsTrashed
      FROM trash_collection tc
     WHERE tc.object_uid = vObjectUid;
    --
    IF ifnull(nIsTrashed, 0) > 0 THEN
      -- trashed collection
      RETURN -5;
      --
    END IF;
    -- 3. CHECK link object collection
    SELECT ifnull(max(lco.id),0)
      INTO nIdLink
      FROM linked_collection_object lco
     WHERE lco.object_uid = vObjectUid
       AND lco.collection_id = nCollectionId
       AND lco.is_trashed = 0;
    --
    IF nIdLink = 0 THEN
      -- NOT link collection
      RETURN -4;
      --
    END IF;
    --
  END IF;
  --  4. CHECK permisstion ON this collection
  IF ifnull(nOwnerID, 0) = ifnull(nUserId, -1) THEN
    -- 4.1. CHECK collection owner
    SET nReturn = 3;
    --
  ELSE
    -- 4.2. CHECK member joined
    SELECT csm.shared_status
      INTO nShared
      FROM collection_shared_member csm
     WHERE csm.collection_id = nCollectionId
       AND csm.member_user_id = nUserId
       AND csm.access = 2; -- editor only
    -- NOT joined shared collection
    SET nReturn = IF(ifnull(nShared, 0) = 1, 1, -2);
    --
  END IF;
  --
  RETURN nReturn;
  --
END