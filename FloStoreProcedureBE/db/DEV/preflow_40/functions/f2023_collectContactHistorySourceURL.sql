CREATE FUNCTION `f2023_collectContactHistorySourceURL`(pvLinkType    VARCHAR(45)
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
   SELECT ch.id, pvLinkType, ch.source_object_type, ch.source_object_uid, ch.user_id, dNow, dNow
     FROM user u
     JOIN contact_history ch ON (u.id = ch.user_id AND ch.source_account_id = 0)
     -- OUTER url aka Invalid link
LEFT JOIN url ON ch.source_object_uid = url.uid
                   -- AND u.id = url.user_id
    WHERE ch.user_id     = ifnull(pnUserID, ch.user_id)
      AND ch.source_account_id  = 0
      AND ch.source_object_uid  = ifnull(pvObjectUid, ch.source_object_uid)
      AND ch.source_object_type = ifnull(pvObjectType, ch.source_object_type)
      AND url.id IS NULL
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = ch.user_id 
                AND fil.link_type = pvLinkType
                AND fil.deleted_date IS NULL
                AND fil.link_id = ch.id
            )
    GROUP BY ch.id, ch.user_id
    ORDER BY ch.created_date DESC
    LIMIT pnMaxTurn;
   
  SELECT ROW_COUNT() INTO nCount;
  --
  RETURN ifnull(nCount, 0);
  --
END