CREATE FUNCTION `f2023_collectLinkedObjectDestShared`(pvLinkType    VARCHAR(45)
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
   SELECT lo.id, pvLinkType, lo.destination_object_type, lo.destination_object_uid, pnUserID, dNow, dNow
     FROM `user` u
     JOIN linked_object lo ON (u.id = lo.user_id 
                           AND lo.destination_account_id = 0)
     JOIN linked_collection_object lco ON (lco.object_type = lo.destination_object_type 
                                       AND lco.object_uid  = lo.destination_object_uid)
      -- OUTER csm aka Invalid link
LEFT JOIN collection_shared_member csm ON (lo.user_id = csm.user_id 
                                       AND csm.shared_status <> 1)
WHERE lo.user_id     = pnUserID
      AND csm.id IS NULL
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id     = lo.user_id 
                AND fil.link_type   = pvLinkType
                AND fil.deleted_date IS NULL
                AND fil.link_id = lo.id
            )
    GROUP BY lo.id, lo.user_id
    ORDER BY lo.created_date DESC
    LIMIT pnMaxTurn;
   
  SELECT ROW_COUNT() INTO nCount;
  --
  RETURN ifnull(nCount, 0);
  --
END