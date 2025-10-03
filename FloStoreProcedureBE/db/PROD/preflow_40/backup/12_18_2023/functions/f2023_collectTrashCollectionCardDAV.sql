CREATE FUNCTION `f2023_collectTrashCollectionCardDAV`(pvLinkType    VARCHAR(45)
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
   SELECT tc.id, pvLinkType, tc.object_type, tc.object_uid, tc.user_id, dNow, dNow
     FROM user u
     JOIN trash_collection tc ON (u.id = tc.user_id)
     -- OUTER calanter aka Invalid link
LEFT JOIN (SELECT ca.id, pp.email, ca.uri -- REPLACE(ca.uri, '.vcf', '') uid
             FROM cards ca
             JOIN addressbooks ab ON (ab.id = ca.addressbookid)
             JOIN principals pp ON (pp.uri = ab.principaluri AND pp.uri = concat('principals/', pvEmail))
          ) cal ON (concat(tc.object_uid,'.vcf') = cal.uri
                    AND tc.object_type  = 'VCARD'
                    AND u.username = cal.email)
    WHERE tc.user_id     = ifnull(pnUserID, tc.user_id)
      AND tc.object_uid  = ifnull(pvObjectUid, tc.object_uid)
      AND tc.object_type = ifnull(pvObjectType, tc.object_type)
      AND cal.id IS NULL
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = tc.user_id 
                AND fil.link_type = pvLinkType
                AND fil.object_uid = tc.object_uid 
                AND fil.object_type = tc.object_type
                AND fil.link_id = tc.id
            )
    ORDER BY tc.created_date DESC
    LIMIT pnMaxTurn;
   
  SELECT ROW_COUNT() INTO nCount;
  --
  RETURN ifnull(nCount, 0);
  --
END