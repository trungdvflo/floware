CREATE PROCEDURE `f2023_collectInvalidLinkToEmailV2`(pvObjectUid   VARBINARY(1000)
                                                                    ,pnUserID      BIGINT(20)
                                                                    ,pvEmail       VARCHAR(255)
                                                                    ,pnConsidering   TINYINT(1)
                                                                    )
f2023_collectInvalidLinkToEmailV2: BEGIN
  -- collect ALL Invalid Link TO Email: listen FROM IMAP event TRIGGER
  -- pnConsidering TO STORED ALL things FOR link considering
  DECLARE no_more_rows      boolean;
  DECLARE nUserId           BIGINT(20) DEFAULT pnUserID;
  DECLARE nID               BIGINT(20) DEFAULT 0;
  DECLARE dNow              DOUBLE(13,3) DEFAULT unix_timestamp(now(3));
  DECLARE nCount            INT(11) DEFAULT 0;
  DECLARE nReturn           INT(11) DEFAULT 0;
  DECLARE nConsidering      INT(11) DEFAULT 0;
  --
  IF ifnull(nUserId, 0) = 0 THEN
    --
    IF ifnull(pvEmail, 'NA') = 'NA' THEN
      --
      SELECT nUserID user_id, pvObjectUid object_uid, pvEmail email, nCount total;
      LEAVE f2023_collectInvalidLinkToEmailV2;
      --
    END IF;
    --     
    SELECT u.id, ifnull(upil.id, 0)
      INTO nUserId, nID
      FROM `user` u
 LEFT JOIN user_process_invalid_link upil ON (u.id = upil.user_id)
     WHERE u.username = pvEmail
      AND u.disabled         = 0 -- active userr only
    LIMIT 1;
    --
  END IF;
  --
  IF ifnull(pnConsidering, 0) = 1 THEN
    -- count considering: must be less than 100.000 email IN queue
    SELECT count(*)
      INTO nConsidering
      FROM flo_invalid_link fil
     WHERE fil.considering = 1;
    --
    IF nConsidering >= 1e3 THEN
      --
      SELECT nUserID user_id, pvObjectUid object_uid, pvEmail email, nCount total;
      LEAVE f2023_collectInvalidLinkToEmailV2;
      --
    END IF;
    --
  END IF;
  -- FORCE DELETE
  IF ifnull(pnConsidering, 0) = 0 THEN
    --
    UPDATE flo_invalid_link fil
       SET fil.considering = 0
     WHERE fil.object_uid = pvObjectUid
       AND fil.object_type = 'EMAIL'
       AND fil.user_id = nUserId
       AND fil.considering = 1;
    --
  END IF;
  --
  IF nID = 0 THEN 
    -- make sure record process existed
    SET nID = f2023_updateUserProcessInvalidDataV2(NULL, nUserID, pvEmail, 0, 0, 0, 0);
    --
  END IF;
  --
   INSERT INTO flo_invalid_link
         (link_id, link_type, object_type, object_uid, user_id, considering, created_date, updated_date)
   SELECT ch.id, 'CH', ch.destination_object_type, ch.destination_object_uid, ch.user_id, pnConsidering, dNow, dNow
     FROM user u
     JOIN contact_history ch ON (u.id = ch.user_id AND ch.destination_account_id = 0)
    WHERE ch.user_id                 = nUserID
      AND ch.destination_account_id  = 0
      AND ch.destination_object_uid  = pvObjectUid
      AND ch.destination_object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = ch.user_id
                AND fil.link_type = 'CH'
                AND fil.object_uid = ch.destination_object_uid
                AND fil.object_type = ch.destination_object_type
                -- NOT dupplicate  collect, rest 24h after first existed CHECK
                AND (fil.considering = pnConsidering OR (fil.considering = -1 
                        AND fil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 24 hour))))
                AND fil.link_id = ch.id
            )
    UNION
   SELECT ch.id, 'CH', ch.source_object_type, ch.source_object_uid, ch.user_id, pnConsidering, dNow, dNow
     FROM user u
     JOIN contact_history ch ON (u.id = ch.user_id AND ch.source_account_id = 0)
    WHERE ch.user_id            = nUserID
      AND ch.source_account_id  = 0
      AND ch.source_object_uid  = pvObjectUid
      AND ch.source_object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = ch.user_id
                AND fil.link_type = 'CH'
                AND fil.object_uid = ch.source_object_uid 
                AND fil.object_type = ch.source_object_type
                -- NOT dupplicate  collect, rest 24h after first existed CHECK
                AND (fil.considering = pnConsidering OR (fil.considering = -1 
                        AND fil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 24 hour))))
                AND fil.link_id = ch.id
            )
    UNION
   SELECT kc.id, 'KC', kc.object_type, kc.object_uid, kc.user_id, pnConsidering, dNow, dNow
     FROM user u
     JOIN kanban_card kc ON (u.id = kc.user_id AND kc.account_id = 0)
    WHERE kc.user_id            = nUserID
      AND kc.account_id  = 0
      AND kc.object_uid  = pvObjectUid
      AND kc.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = kc.user_id
                AND fil.link_type = 'KC'
                AND fil.object_uid = kc.object_uid 
                AND fil.object_type = kc.object_type
                 -- NOT dupplicate  collect, rest 24h after first existed CHECK
                AND (fil.considering = pnConsidering OR (fil.considering = -1 
                        AND fil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 24 hour))))
                AND fil.link_id = kc.id
            )
    UNION
   SELECT lco.id, 'LCO', lco.object_type, lco.object_uid, lco.user_id, pnConsidering, dNow, dNow
     FROM user u
     JOIN linked_collection_object lco ON (u.id = lco.user_id AND lco.account_id = 0)
    WHERE lco.user_id     = nUserID
      AND lco.account_id  = 0
      AND lco.object_uid  = pvObjectUid
      AND lco.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = lco.user_id 
                AND fil.link_type = 'LCO'
                AND fil.object_uid = lco.object_uid 
                AND fil.object_type = lco.object_type
                 -- NOT dupplicate  collect, rest 24h after first existed CHECK
                AND (fil.considering = pnConsidering OR (fil.considering = -1 
                        AND fil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 24 hour))))
                AND fil.link_id = lco.id
            )
    UNION         
   SELECT lo.id, 'LO', lo.destination_object_type, lo.destination_object_uid, lo.user_id, pnConsidering, dNow, dNow
     FROM user u
     JOIN linked_object lo ON (u.id = lo.user_id AND lo.destination_account_id = 0)
    WHERE lo.user_id                 = nUserID
      AND lo.destination_account_id  = 0
      AND lo.destination_object_uid  = pvObjectUid
      AND lo.destination_object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = lo.user_id 
                AND fil.link_type = 'LO'
                AND fil.object_uid = lo.destination_object_uid 
                AND fil.object_type = lo.destination_object_type
                 -- NOT dupplicate  collect, rest 24h after first existed CHECK
                AND (fil.considering = pnConsidering OR (fil.considering = -1 
                        AND fil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 24 hour))))
                AND fil.link_id = lo.id
            )
    UNION     
   SELECT lo.id, 'LO', lo.source_object_type, lo.source_object_uid, lo.user_id, pnConsidering, dNow, dNow
     FROM user u
     JOIN linked_object lo ON (u.id = lo.user_id AND lo.source_account_id = 0)
    WHERE lo.user_id            = nUserID
      AND lo.source_account_id  = 0
      AND lo.source_object_uid  = pvObjectUid
      AND lo.source_object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = lo.user_id 
                AND fil.link_type = 'LO'
                AND fil.object_uid = lo.source_object_uid 
                AND fil.object_type = lo.source_object_type
                -- NOT dupplicate  collect, rest 24h after first existed CHECK
                AND (fil.considering = pnConsidering OR (fil.considering = -1 
                        AND fil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 24 hour))))
                AND fil.link_id = lo.id
            )
    UNION       
   SELECT tc.id, 'TC', tc.object_type, tc.object_uid, tc.user_id, pnConsidering, dNow, dNow
     FROM user u
     JOIN trash_collection tc ON (u.id = tc.user_id)
    WHERE tc.user_id            = nUserID
      AND tc.object_uid  = pvObjectUid
      AND tc.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = tc.user_id 
                AND fil.link_type = 'TC'
                AND fil.object_uid = tc.object_uid 
                AND fil.object_type = tc.object_type
                -- NOT dupplicate  collect, rest 24h after first existed CHECK
                AND (fil.considering = pnConsidering OR (fil.considering = -1 
                        AND fil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 24 hour))))
                AND fil.link_id = tc.id
            )
    UNION       
   SELECT et.id, 'ET', et.object_type, et.object_uid, et.user_id, pnConsidering, dNow, dNow
     FROM user u
     JOIN email_tracking et ON (u.id = et.user_id)
    WHERE et.user_id            = nUserID
      AND et.object_uid  = pvObjectUid
      AND et.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = et.user_id 
                AND fil.link_type = 'ET'
                AND fil.object_uid = et.object_uid 
                AND fil.object_type = et.object_type
                -- NOT dupplicate  collect, rest 24h after first existed CHECK
                AND (fil.considering = pnConsidering OR (fil.considering = -1 
                        AND fil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 24 hour))))
                AND fil.link_id = et.id
            )
    UNION       
   SELECT me.id, 'ME', me.object_type, me.object_uid, me.user_id, pnConsidering, dNow, dNow
     FROM user u
     JOIN metadata_email me ON (u.id = me.user_id)
    WHERE me.user_id            = nUserID
      AND me.object_uid  = pvObjectUid
      AND me.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = me.user_id 
                AND fil.link_type = 'ME'
                AND fil.object_uid = me.object_uid 
                AND fil.object_type = me.object_type
                -- NOT dupplicate  collect, rest 24h after first existed CHECK
                AND (fil.considering = pnConsidering OR (fil.considering = -1 
                        AND fil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 24 hour))))
                AND fil.link_id = me.id
            )
     ON DUPLICATE KEY UPDATE updated_date=VALUES(updated_date)
                            ,considering=VALUES(considering);
  -- public via queue
  SELECT ROW_COUNT() INTO nCount;
  --
  SELECT nUserID user_id, pvObjectUid object_uid, pvEmail email, nCount total;
  --
END