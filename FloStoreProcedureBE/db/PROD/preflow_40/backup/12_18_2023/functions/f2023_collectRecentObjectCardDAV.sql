CREATE FUNCTION `f2023_collectRecentObjectCardDAV`(pvLinkType    VARCHAR(45)
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
   SELECT ro.id, pvLinkType, ro.object_type, ro.object_uid, ro.user_id, dNow, dNow
     FROM user u
     JOIN recent_object ro ON (u.id = ro.user_id AND ro.account_id = 0)
     -- OUTER calanter aka Invalid link
LEFT JOIN (SELECT ca.id, pp.email, ca.uri -- REPLACE(ca.uri, '.vcf', '') uid
             FROM cards ca
             JOIN addressbooks ab ON (ab.id = ca.addressbookid)
             JOIN principals pp ON (pp.uri = ab.principaluri AND pp.uri = concat('principals/', pvEmail))
          ) cal ON (concat(ro.object_uid,'.vcf') = cal.uri
                    AND ro.object_type  = 'VCARD'
                    AND u.username = cal.email)
    WHERE ro.user_id     = ifnull(pnUserID, ro.user_id)
      AND ro.account_id  = 0
      AND ro.object_uid  = ifnull(pvObjectUid, ro.object_uid)
      AND ro.object_type = ifnull(pvObjectType, ro.object_type)
      AND cal.id IS NULL
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = ro.user_id 
                AND fil.link_type = pvLinkType
                AND fil.object_uid = ro.object_uid 
                AND fil.object_type = ro.object_type
                AND fil.link_id = ro.id
            )
    ORDER BY ro.created_date DESC
    LIMIT pnMaxTurn;
   
  SELECT ROW_COUNT() INTO nCount;
  --
  RETURN ifnull(nCount, 0);
  --
END