CREATE FUNCTION `f2023_collectLinkedCollectionObjectCloud`(pvLinkType VARCHAR(45)
                                                                             ,pvObjectUid   VARBINARY(1000)
                                                                             ,pvObjectType  VARBINARY(50)
                                                                             ,pnUserID      BIGINT(20)
                                                                             ,pvEmail       VARCHAR(255)
                                                                             ,pnMaxTurn     INT(4)
                                                                             ) RETURNS INT(11)
BEGIN
  --
  DECLARE no_more_rows      boolean;
  DECLARE vObjectUid        VARBINARY(1000);
  DECLARE vObjectType       VARBINARY(50);
  DECLARE nUserId           BIGINT(20);
  DECLARE nLinkId           BIGINT(20);
  DECLARE nLinkType         VARCHAR(45);
  DECLARE dNow              DOUBLE(13,3) DEFAULT unix_timestamp(CURRENT_TIMESTAMP(3));
  DECLARE nCount            INT(11) DEFAULT 0;
  --
   INSERT INTO flo_invalid_link
        (link_id, link_type, object_type, object_uid, user_id, created_date, updated_date)
   SELECT lco.id, pvLinkType, lco.object_type, lco.object_uid, lco.user_id, dNow, dNow
     FROM user u
     JOIN linked_collection_object lco ON (u.id = lco.user_id AND lco.account_id = 0)
     -- OUTER clo aka Invalid link
LEFT JOIN cloud clo ON lco.object_uid = clo.uid
                    AND u.id = clo.user_id
    WHERE lco.user_id     = ifnull(pnUserID, lco.user_id)
      AND lco.account_id  = 0
      AND lco.object_uid  = ifnull(pvObjectUid, lco.object_uid)
      AND lco.object_type = ifnull(pvObjectType, lco.object_type)
      AND clo.id IS NULL
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = lco.user_id 
                AND fil.link_type = pvLinkType
                AND fil.object_uid = lco.object_uid 
                AND fil.object_type = lco.object_type
                AND fil.link_id = lco.id
            )
    ORDER BY lco.created_date DESC
    LIMIT pnMaxTurn;
   
  SELECT ROW_COUNT() INTO nCount;
  --
  RETURN ifnull(nCount, 0);
  --
END