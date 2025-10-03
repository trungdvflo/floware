CREATE FUNCTION `f2023_collectLinkedObjectSourceCalDAV`(pvLinkType    VARCHAR(45)
                                                                           ,pvObjectUid   VARBINARY(1000)
                                                                           ,pvObjectType  VARBINARY(50)
                                                                           ,pnUserID      BIGINT(20)
                                                                           ,pvEmail       VARCHAR(255)
                                                                           ,pnMaxTurn     INT(4)) RETURNS INT(11)
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
   SELECT lo.id, pvLinkType, lo.source_object_type, lo.source_object_uid, lo.user_id, dNow, dNow
     FROM user u
     JOIN linked_object lo ON (u.id = lo.user_id AND lo.source_account_id = 0)
     -- OUTER calanter aka Invalid link
LEFT JOIN (SELECT co.id, pp.email, co.uid
             FROM calendarobjects co
             JOIN calendarinstances cali ON (cali.calendarid = co.calendarid)
             JOIN principals pp ON (pp.uri = cali.principaluri AND pp.uri = concat('principals/', pvEmail))
          ) cal ON (lo.source_object_uid = cal.uid 
                    AND lo.source_object_type IN ('VTODO', 'VEVENT', 'VJOURNAL')
                    AND u.username = cal.email)
    WHERE lo.user_id     = pnUserID
      AND lo.source_account_id = 0
      AND lo.source_object_uid  = ifnull(pvObjectUid, lo.source_object_uid)
      AND lo.source_object_type = ifnull(pvObjectType, lo.source_object_type)
      AND cal.id IS NULL
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = lo.user_id 
                AND fil.link_type = pvLinkType
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