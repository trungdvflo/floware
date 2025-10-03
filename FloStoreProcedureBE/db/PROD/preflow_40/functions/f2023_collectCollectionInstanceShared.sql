CREATE FUNCTION `f2023_collectCollectionInstanceShared`(pvLinkType    VARCHAR(45)
                                                               ,pvObjectUid   VARBINARY(1000)
                                                               ,ppvObjectType  VARBINARY(50)
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
   SELECT cim.id, pvLinkType, '' object_type, '' object_uid, cim.user_id, dNow, dNow
     FROM user u
     JOIN collection_instance_member cim ON (u.id = cim.user_id)
LEFT JOIN collection co ON (cim.collection_id = co.id)
    WHERE cim.user_id     = pnUserID
      AND co.type        = 3 -- SHARED
      AND co.user_id    <> pnUserID -- MEMBER ONLY
      -- NOT EXISTS CSM aka invalid shared
      AND NOT EXISTS 
            (SELECT 1
               FROM collection_shared_member csm
              WHERE csm.member_user_id = cim.user_id
                AND csm.collection_id = cim.collection_id
                AND csm.shared_status = 1
            )
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = cim.user_id 
                AND fil.link_type = pvLinkType
                AND fil.deleted_date IS NULL
                AND fil.link_id = cim.id
            )
    GROUP BY cim.id, cim.user_id
    ORDER BY cim.created_date DESC
    LIMIT pnMaxTurn;
   
  SELECT ROW_COUNT() INTO nCount;
  --
  RETURN ifnull(nCount, 0);
  --
END