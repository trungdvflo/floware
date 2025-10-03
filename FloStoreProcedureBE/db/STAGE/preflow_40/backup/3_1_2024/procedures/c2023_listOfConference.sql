CREATE PROCEDURE `c2023_listOfConference`(pvKeyword         TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                            ,pvEmails          TEXT
                                                            ,pnFilterType      TINYINT(1)
                                                            ,pvColIds          TEXT
                                                            ,pvChannelIDs      TEXT
                                                            ,pnUserId          BIGINT(20)
                                                            ,pvIDs             TEXT
                                                            ,pnModifiedGTE     DOUBLE(14,4)
                                                            ,pnModifiedLT      DOUBLE(14,4)
                                                            ,pnMinId           BIGINT(20)
                                                            ,pnVip             TINYINT(1)
                                                            ,pnPageSize        INTEGER(11)
                                                            ,pnPageNo          INTEGER(11)
                                                            ,pvSort            VARCHAR(128))
BEGIN
  -- 
  DECLARE nOFFSET     INT(11) DEFAULT 0;
  DECLARE vSort       VARCHAR(50) DEFAULT IF(IFNULL(pvSort, '') <> '' -- DEFAULT +: ASC
                                               AND NOT instr(pvSort, '-') 
                                               AND NOT instr(pvSort, '+'), concat('+', pvSort), ifnull(pvSort, '-start_time'));
  DECLARE vFieldSort  VARCHAR(50) DEFAULT REPLACE(REPLACE(IFNULL(vSort, ''), '-', ''), '+', '');
  DECLARE vKeyword    TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT ifnull(pvKeyword, '');
  DECLARE vKeyword1   TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE vKeyword2   TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE nFilterType TEXT DEFAULT ifnull(pnFilterType, 1);
  -- value = 1 >> search BY channel name (keyword=channel name) 
  SET vKeyword1 = CONCAT('( ',vKeyword,')|(^',vKeyword,')');
  -- value = 2 >> search BY participant 
  SET vKeyword2 = CONCAT('( ',vKeyword,')|(^',vKeyword,')|(@',vKeyword,')');
  --
  SET nOFFSET = IF(ifnull(pnPageNo, 0) > 0, (pnPageNo - 1) * pnPageSize, 0);
  --
  SET SESSION group_concat_max_len = 500000;
  --
  SELECT cm.id, cm.channel_id, cc.uid, cm.email, cm.is_creator, cm.description
        ,cm.vip, cm.revoke_time, greatest(cm.updated_date, cc.updated_date) updated_date, cm.created_date, cm.join_time
        ,ifnull(cm.view_chat_history, 1) view_chat_history
        ,cc.room_url, ifnull(cc.enable_chat_history, 1) enable_chat_history
        ,COALESCE(cm.title, cc.title, '') title
        ,cc.title share_title
        ,ch.start_time, ch.end_time, ch.action_time, ch.status, ch.type
        ,CONCAT('[',GROUP_CONCAT(DISTINCT
                      JSON_OBJECT(
                        'id', cm1.id
                       ,'email',cm1.email
                       ,'is_creator', cm1.is_creator
                       ,'revoke_time', cm1.revoke_time
                      )),']'
                    ) participants
     FROM conference_channel cc
     JOIN conference_member cm ON (cm.channel_id = cc.id AND cm.user_id = pnUserId)
LEFT JOIN conference_member cm1 ON (cc.id = cm1.channel_id)
LEFT JOIN (SELECT ch.member_id, ch.user_id
                   ,ch.start_time, ch.end_time, ch.action_time, ch.status, ch.type
               FROM conference_history ch
              WHERE ch.user_id = pnUserId
                AND ch.id = (SELECT ch1.id
                               FROM conference_history ch1
                              WHERE ch1.user_id = pnUserId
                                AND ch1.member_id = ch.member_id
                                ORDER BY ch1.start_time DESC
                                LIMIT 1
                              )
                          ) ch ON (cm.id = ch.member_id AND cm.user_id = ch.user_id)
LEFT JOIN linked_collection_object lco ON (cc.uid = lco.object_uid 
                                           AND cm.user_id = lco.user_id 
                                           AND lco.object_type = 'CONFERENCING' 
                                           AND (pvColIds IS NULL OR ifnull(lco.collection_id, 0) > 0)
                                           AND ifnull(lco.is_trashed, 0) = 0
                                           )
    WHERE cm.user_id = pnUserId
      AND (cm.revoke_time = 0 -- NOT revoked
           OR (cm.revoke_time > 0 AND cm.user_id = pnUserId)) -- revoked but me
      AND (cm1.revoke_time = 0 -- NOT revoked
           OR (cm1.revoke_time > 0 AND cm1.user_id = pnUserId)) -- revoked but me
      -- AND cm.updated_date  <  IF(ifnull(pnModifiedLT, 0) > 0, pnModifiedLT, unix_timestamp() + 1)
      -- AND cm.updated_date  >= IF(ifnull(pnModifiedGTE, 0) > 0, pnModifiedGTE, 0)
      
      AND (
          cm.updated_date < IF(ifnull(pnModifiedLT, 0) > 0, pnModifiedLT, unix_timestamp() + 1)
          OR
          cc.updated_date < IF(ifnull(pnModifiedLT, 0) > 0, pnModifiedLT, unix_timestamp() + 1)
          )
      AND (
          cm.updated_date >= IF(ifnull(pnModifiedGTE, 0) > 0, pnModifiedGTE, 0)
          OR
          cc.updated_date >= IF(ifnull(pnModifiedGTE, 0) > 0, pnModifiedGTE, 0)
          )
      
      AND cm.id            >  IF(ifnull(pnMinId, 0) > 0, pnMinId, 0)
      AND (pnVip IS NULL OR cm.vip = pnVip)
      AND IF(pvIDs IS NOT NULL, FIND_IN_SET(cm.id, pvIDs), 1)
      AND IF(pvChannelIDs IS NOT NULL, FIND_IN_SET(cc.id, pvChannelIDs), 1)
      AND IF(pvColIds IS NOT NULL, FIND_IN_SET(lco.collection_id, pvColIds), 1)
      -- value = 1 >> search BY channel name (keyword=channel name) 
      AND IF(nFilterType = 1, COALESCE(cm.title, cc.title, '') RLIKE vKeyword1, 1)
      -- value = 2 >> search BY participant 
      AND IF(nFilterType <> 2, 1, EXISTS (
            SELECT 1
              FROM conference_member cm2
             WHERE cm2.channel_id = cc.id
               AND cm2.user_id <> pnUserId
               AND cm2.revoke_time = 0
               AND CASE
                     -- 1. email & keyword                 
                     WHEN NOT isnull(pvKeyword) AND NOT isnull(pvEmails)
                       THEN (cm2.email RLIKE vKeyword2 OR FIND_IN_SET(cm2.email, pvEmails))
                     -- 2. email & keyword = blank
                     WHEN isnull(pvKeyword) AND NOT isnull(pvEmails)
                       THEN FIND_IN_SET(cm2.email, pvEmails)
                     -- 3. email=blank & keyword
                     WHEN NOT isnull(pvKeyword) AND isnull(pvEmails)
                       THEN cm2.email RLIKE vKeyword2
                     ELSE 1
                     --
                    END
         ))
      -- value = 3,4,5 >> search BY channel name || participant 
      AND (IF(find_in_set(nFilterType, '3,4,5')
          ,IF(isnull(pvKeyword) AND NOT isnull(pvEmails)
             ,0
             ,COALESCE(cm.title, cc.title, '') RLIKE vKeyword1)
          OR EXISTS (
             SELECT 1
               FROM conference_member cm2
              WHERE cm2.channel_id = cc.id
                AND cm2.user_id <> pnUserId
                AND cm2.revoke_time = 0
                AND CASE
                      -- 1. email & keyword                 
                      WHEN NOT isnull(pvKeyword) AND NOT isnull(pvEmails)
                        THEN (cm2.email RLIKE vKeyword2 OR FIND_IN_SET(cm2.email, pvEmails))
                      -- 2. email & keyword = blank
                      WHEN isnull(pvKeyword) AND NOT isnull(pvEmails)
                        THEN FIND_IN_SET(cm2.email, pvEmails)
                      -- 3. email=blank & keyword
                      WHEN NOT isnull(pvKeyword) AND isnull(pvEmails)
                        THEN cm2.email RLIKE vKeyword2
                     ELSE 1
                      --
                     END
         ), 1)
        )
        -- value = 4 >> 3 + missed CALL 
        AND IF(nFilterType = 4, ch.status = 24, 1)
      GROUP BY cc.id, cm.id, cm1.channel_id
      -- value = 5 >> 3 + only 1 participant
      HAVING nFilterType < 5 
           OR (nFilterType = 5 
              AND count(DISTINCT cm1.id) = 2) -- only 2 member contained me
      ORDER BY
        (CASE
           --
           WHEN NOT isnull(pnModifiedLT) THEN cm.updated_date
           WHEN (ifnull(pnPageNo, 0) > 0 OR (isnull(pnMinId) AND isnull(pnModifiedGTE)))
                 AND INSTR(vSort, "-") THEN -- DEFAULT WHEN no ASC active
             --
             CASE vFieldSort
               --
               WHEN 'start_time'   THEN GREATEST(ifnull(ch.start_time, 0), cc.created_date)
               WHEN 'action_time'  THEN ch.action_time
               WHEN 'created_date' THEN cm.created_date
               WHEN 'title'        THEN ifnull(cm.title, cc.title)
               --
             END
           --
         END) DESC,
        (CASE
           --
           WHEN NOT isnull(pnMinId) THEN cm.id
           WHEN NOT isnull(pnModifiedGTE) THEN cm.updated_date
           WHEN INSTR(vSort, "+") THEN
             --
             CASE vFieldSort 
               --
               WHEN 'start_time'    THEN GREATEST(ifnull(ch.start_time, 0), cm.created_date)
               WHEN 'action_time'  THEN ch.action_time
               WHEN 'created_date' THEN cm.created_date
               WHEN 'title'        THEN ifnull(cm.title, cc.title)
               --
              END
           --
         END) ASC
       --
       LIMIT pnPageSize
      OFFSET nOFFSET;
      --
      SET SESSION group_concat_max_len = 1024;
     --
    END