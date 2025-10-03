CREATE FUNCTION `f2023_collectKanbanCardShared`(pvLinkType    VARCHAR(45)
                                                                  ,pvObjectUid   VARBINARY(1000)
                                                                  ,pvObjectType  VARBINARY(50)
                                                                  ,pnUserID      BIGINT(20)
                                                                  ,pvEmail       VARCHAR(255)
                                                                  ,pnMaxTurn     INT(4)
                                                                  ) RETURNS INT(11)
BEGIN
  --
  DECLARE no_more_rows      boolean;
  DECLARE dNow              DOUBLE(13,3) DEFAULT unix_timestamp(CURRENT_TIMESTAMP(3));
  DECLARE nCount            INT(11) DEFAULT 0;
  --
   INSERT INTO flo_invalid_link
        (link_id, link_type, object_type, object_uid, user_id, created_date, updated_date)
   SELECT kc.id, pvLinkType, kc.object_type, kc.object_uid, pnUserID, dNow, dNow
     FROM user u
     JOIN kanban_card kc ON (u.id = kc.user_id AND kc.account_id = 0)
     -- make sure shared object least of a LCO
     JOIN linked_collection_object lco ON (lco.object_uid = kc.object_uid AND lco.object_type = kc.object_type)
     JOIN collection co ON (lco.collection_id = co.id)
    WHERE kc.user_id     = ifnull(pnUserID, kc.user_id)
      AND kc.account_id = 0
      AND kc.object_uid  = ifnull(pvObjectUid, kc.object_uid)
      AND kc.object_type = ifnull(pvObjectType, kc.object_type)
      -- 
      AND co.type = 3
      AND co.user_id <> pnUserID -- shared TO me
      AND lco.user_id <> pnUserID -- shared TO me
      -- NOT EXISTS CSM aka invalid shared
      AND NOT EXISTS (SELECT 1
                        FROM collection_shared_member csm
                       WHERE csm.member_user_id = kc.user_id
                         AND csm.user_id = pnUserID
                         AND csm.collection_id = co.id
                         AND csm.shared_status = 1
            )
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS (SELECT 1
                        FROM flo_invalid_link fil
                       WHERE fil.user_id = kc.user_id 
                         AND fil.link_type = pvLinkType
                         AND fil.object_uid = kc.object_uid 
                         AND fil.object_type = kc.object_type
                         AND fil.deleted_date IS NULL
                         AND fil.link_id = kc.id
            )
    GROUP BY kc.id, kc.user_id
    ORDER BY kc.created_date DESC
    LIMIT pnMaxTurn;
   
  SELECT ROW_COUNT() INTO nCount;
  --
  RETURN ifnull(nCount, 0);
  --
END