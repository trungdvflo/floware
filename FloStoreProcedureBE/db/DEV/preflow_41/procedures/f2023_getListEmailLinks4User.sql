CREATE PROCEDURE `f2023_getListEmailLinks4User`(pnUserID      BIGINT(20)
                                                                  ,pvEmail       VARCHAR(255)
                                                              )
f2023_getListEmailLinks4User:BEGIN
  -- GET ALL link of email FOR user
  DECLARE no_more_rows      boolean;
  DECLARE nUserId           BIGINT(20) DEFAULT pnUserID;
  DECLARE nID               BIGINT(20) DEFAULT 0;
  DECLARE dNow              DOUBLE(13,3) DEFAULT unix_timestamp(now(3));
  DECLARE nCount            INT(11) DEFAULT 0;
  DECLARE nConsidering      INT(11) DEFAULT 0;
  --
  IF ifnull(nUserId, 0) = 0 THEN
    --
    IF ifnull(pvEmail, 'NA') = 'NA' THEN
      --
      LEAVE f2023_getListEmailLinks4User;
      --
    END IF;
    --
    SELECT u.id
      INTO nUserId
      FROM `user` u
     WHERE u.username = pvEmail
       AND u.disabled         = 0 -- active userr only
     LIMIT 1;
    --
    IF ifnull(nUserId, 0) = 0 THEN
      --
      LEAVE f2023_getListEmailLinks4User;
      --
    END IF;
  END IF;
  -- count considering: must be less than 100.000 email IN queue
  SELECT count(*)
    INTO nConsidering
    FROM flo_invalid_link fil
   WHERE fil.considering = 1
     AND fil.deleted_date IS NULL;
  --
  IF nConsidering >= 1e3 THEN
    --
    SELECT NULL object_uid;
    LEAVE f2023_getListEmailLinks4User;
    --
  END IF;
  SELECT ch.destination_object_uid object_uid
    FROM user u
    JOIN contact_history ch ON (u.id = ch.user_id AND ch.destination_account_id = 0)
   WHERE ch.user_id                 = nUserID
     AND ch.destination_account_id  = 0
     AND ch.destination_object_type = 'EMAIL'
    -- NOT EXISTS FIL aka inserted BEFORE
     AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = ch.user_id 
                AND fil.link_type = 'CH'
                AND fil.object_uid = ch.destination_object_uid 
                AND fil.object_type = ch.destination_object_type
                AND fil.link_id = ch.id
            )
    UNION
   SELECT ch.source_object_uid object_uid
     FROM user u
     JOIN contact_history ch ON (u.id = ch.user_id AND ch.source_account_id = 0)
    WHERE ch.user_id            = nUserID
      AND ch.source_account_id  = 0
      AND ch.source_object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = ch.user_id 
                AND fil.link_type = 'CH'
                AND fil.object_uid = ch.source_object_uid 
                AND fil.object_type = ch.source_object_type
                AND fil.link_id = ch.id
            )
    UNION
   SELECT kc.object_uid
     FROM user u
     JOIN kanban_card kc ON (u.id = kc.user_id AND kc.account_id = 0)
    WHERE kc.user_id            = nUserID
      AND kc.account_id  = 0
      AND kc.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = kc.user_id 
                AND fil.link_type = 'KC'
                AND fil.object_uid = kc.object_uid 
                AND fil.object_type = kc.object_type
                AND fil.link_id = kc.id
            )
    UNION
   SELECT lco.object_uid
     FROM user u
     JOIN linked_collection_object lco ON (u.id = lco.user_id AND lco.account_id = 0)
    WHERE lco.user_id             = nUserID
      AND lco.account_id  = 0
      AND lco.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = lco.user_id 
                AND fil.link_type = 'LCO'
                AND fil.object_uid = lco.object_uid 
                AND fil.object_type = lco.object_type
                AND fil.link_id = lco.id
            )
    UNION         
   SELECT lo.destination_object_uid object_uid
     FROM user u
     JOIN linked_object lo ON (u.id = lo.user_id AND lo.destination_account_id = 0)
    WHERE lo.user_id            = nUserID
      AND lo.destination_account_id  = 0
      AND lo.destination_object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = lo.user_id 
                AND fil.link_type = 'LO'
                AND fil.object_uid = lo.destination_object_uid 
                AND fil.object_type = lo.destination_object_type
                AND fil.link_id = lo.id
            )
    UNION     
   SELECT lo.source_object_uid object_uid
     FROM user u
     JOIN linked_object lo ON (u.id = lo.user_id AND lo.source_account_id = 0)
    WHERE lo.user_id            = nUserID
      AND lo.source_account_id  = 0
      AND lo.source_object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = lo.user_id 
                AND fil.link_type = 'LO'
                AND fil.object_uid = lo.source_object_uid 
                AND fil.object_type = lo.source_object_type
                AND fil.link_id = lo.id
            )
    UNION       
   SELECT tc.object_uid
     FROM user u
     JOIN trash_collection tc ON (u.id = tc.user_id)
    WHERE tc.user_id            = nUserID
      AND tc.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = tc.user_id 
                AND fil.link_type = 'TC'
                AND fil.object_uid = tc.object_uid 
                AND fil.object_type = tc.object_type
                AND fil.link_id = tc.id
            )
    UNION       
   SELECT et.object_uid
     FROM user u
     JOIN email_tracking et ON (u.id = et.user_id)
    WHERE et.user_id            = nUserID
      AND et.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = et.user_id 
                AND fil.link_type = 'ET'
                AND fil.object_uid = et.object_uid 
                AND fil.object_type = et.object_type
                AND fil.link_id = et.id
            )
    UNION       
   SELECT me.object_uid
     FROM user u
     JOIN metadata_email me ON (u.id = me.user_id)
    WHERE me.user_id            = nUserID
      AND me.object_type = 'EMAIL'
     -- NOT EXISTS FIL aka inserted BEFORE
      AND NOT EXISTS 
            (SELECT 1
               FROM flo_invalid_link fil
              WHERE fil.user_id = me.user_id 
                AND fil.link_type = 'ME'
                AND fil.object_uid = me.object_uid 
                AND fil.object_type = me.object_type
                AND fil.link_id = me.id
            );
  --
END