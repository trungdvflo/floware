CREATE FUNCTION `f2023_collectLinkedCollectionObjectShared`(pvLinkType    VARCHAR(45)
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
        (collection_id, link_id, link_type, object_type, object_uid, user_id, created_date, updated_date)
   SELECT lco.collection_id, lco.id, pvLinkType, lco.object_type, lco.object_uid, lco.user_id, dNow, dNow
     FROM user u
     JOIN linked_collection_object lco ON (u.id = lco.user_id AND lco.account_id = 0)
     -- OUTER CSM aka Invalid link
LEFT JOIN collection_shared_member csm ON (lco.user_id = csm.user_id AND csm.shared_status <> 1)
    WHERE lco.user_id     = ifnull(pnUserID, lco.user_id)
      AND lco.account_id  = 0
      AND lco.object_uid  = ifnull(pvObjectUid, lco.object_uid)
      AND lco.object_type = ifnull(pvObjectType, lco.object_type)
      AND csm.id IS NULL
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = lco.user_id 
                AND fil.link_type = pvLinkType
                AND fil.object_uid = lco.object_uid 
                AND fil.object_type = lco.object_type
                AND fil.deleted_date IS NULL
                AND fil.link_id = lco.id
            )
    GROUP BY lco.id, lco.user_id
    ORDER BY lco.created_date DESC
    LIMIT pnMaxTurn;
   
  SELECT ROW_COUNT() INTO nCount;
  --
  RETURN ifnull(nCount, 0);
  --
END