CREATE FUNCTION `f2023_collectKanbanCardCalDAV`(pvLinkType    VARCHAR(45)
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
   SELECT kc.id, pvLinkType, kc.object_type, kc.object_uid, kc.user_id, dNow, dNow
     FROM user u
     JOIN kanban_card kc ON (u.id = kc.user_id AND kc.account_id = 0)
     -- OUTER calanter aka Invalid link
LEFT JOIN (SELECT co.id, pp.email, co.uid
             FROM calendarobjects co
             JOIN calendarinstances cali ON (cali.calendarid = co.calendarid)
             JOIN principals pp ON (pp.uri = cali.principaluri AND pp.uri = concat('principals/', pvEmail))
          ) cal ON (kc.object_uid = cal.uid 
                    AND kc.object_type IN ('VTODO', 'VEVENT', 'VJOURNAL')
                    AND u.username = cal.email)
    WHERE kc.user_id     = ifnull(pnUserID, kc.user_id)
      AND kc.account_id = 0
      AND kc.object_uid  = ifnull(pvObjectUid, kc.object_uid)
      AND kc.object_type = ifnull(pvObjectType, kc.object_type)
      AND cal.id IS NULL
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
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