CREATE PROCEDURE `n2023_listOfNotification`(
 pnCollectionId  BIGINT(20)
,pnUserId        BIGINT(20)
,pvUsername      VARCHAR(100)
,pvCommentIds    TEXT
,pnModifiedGTE   DOUBLE(14,4)
,pnModifiedLT    DOUBLE(14,4)
,pnMinId         BIGINT(20)
,pnPageSize      INTEGER(11)
,pnPageNo        INTEGER(11)
,pvSort          VARCHAR(128)
)
BEGIN
  --
  DECLARE nOFFSET INT(11) DEFAULT 0;
  DECLARE vFieldSort    VARCHAR(50) DEFAULT REPLACE(REPLACE(IFNULL(pvSort, ''), '-', ''), '+', '');
  -- DEFAULT IS ASC
 DECLARE vSort       VARCHAR(50) DEFAULT IF(IFNULL(pvSort, '') <> '' -- DEFAULT +: ASC
                                               AND NOT instr(pvSort, '-') 
                                               AND NOT instr(pvSort, '+'), concat('+', pvSort), ifnull(pvSort, '-action_time'));
  --
  IF ifnull(pvSort, 'NA') <> 'NA' THEN
    --
    SET nOFFSET = IF(ifnull(pnPageNo, 0) = 0, 0, (pnPageNo - 1) * pnPageSize);
    --
  END IF;
   SELECT cn.id, cn.email, cn.collection_id, cn.object_uid, cn.object_type
        -- VIRTUAL action: 63 - MENTIONED
         ,IF((cn.action = 6 OR cn.action = 61) AND ifnull(mu.id, 0) > 0 ,63, cn.action) `action`
         ,cn.content, cn.action_time, cn.comment_id, cn.created_date, cn.updated_date
         ,permission.member_calendar_uri, permission.member_email, permission.member_user_id
         ,permission.owner_user_id, permission.owner_calendar_uri, permission.owner_username, permission.owner_user_id
         ,IF(cn.object_type = 'URL' ,'', concat("/calendarserver.php/calendars/"
             ,permission.owner_username, "/"
             ,permission.owner_calendar_uri, "/"
             ,CONVERT(cn.object_uid USING cp1251), ".ics")) object_href
         ,(CASE
            WHEN cn.object_type = 'VEVENT' THEN ifnull(ce.summary, '')
            WHEN cn.object_type = 'VJOURNAL' THEN ifnull(cn1.summary, '')
            WHEN cn.object_type = 'VTODO' THEN ifnull(ct.summary, '')
            WHEN cn.object_type = 'URL' THEN ifnull(url.title, '')
          END ) last_object_title
     FROM collection_notification cn 
-- LEFT JOIN collection_shared_member csm ON (csm.collection_id = cn.collection_id AND csm.shared_status = 1)  
LEFT JOIN collection_comment cm ON (cn.comment_id = cm.id )
LEFT JOIN comment_mention cm1 ON (cm1.comment_id = cm.id)
LEFT JOIN mention_user mu ON (cm1.mention_user_id = mu.id AND (mu.user_id = pnUserId OR mu.email = pvUsername))
LEFT JOIN cal_event ce ON (cn.object_uid = ce.uid AND cn.object_type = 'VEVENT')  
LEFT JOIN cal_note cn1 ON (cn.object_uid = cn1.uid AND cn.object_type = 'VJOURNAL')  
LEFT JOIN cal_todo ct ON (cn.object_uid = ct.uid AND cn.object_type = 'VTODO')  
LEFT JOIN url ON (cn.object_uid = url.uid AND cn.object_type = 'URL')
     JOIN (
          -- owner existed collection_id
          SELECT co.id collection_id, co.calendar_uri owner_calendar_uri, co.user_id owner_user_id
                ,'' member_calendar_uri, '' member_email
                ,0 member_user_id
                ,usr.username owner_username
            FROM collection co
            JOIN user usr ON (co.user_id = usr.id)
           WHERE co.id = IF(ifnull(pnCollectionId, 0) > 0, pnCollectionId, co.id)
             AND co.`type` = IF(ifnull(pnCollectionId, 0) > 0, co.`type`, 3) -- owner GET BY uid? dont need TO share
             AND co.user_id = pnUserId
          -- member existed collection_id
          UNION
          SELECT co.id collection_id, co.calendar_uri owner_calendar_uri, co.user_id owner_user_id
                ,csm.calendar_uri member_calendar_uri, csm.shared_email member_email
                ,csm.member_user_id
                ,usr.username owner_username
            FROM collection co
            JOIN user usr ON (co.user_id = usr.id)
            JOIN collection_shared_member csm ON (csm.collection_id = co.id AND csm.shared_status = 1)
           WHERE co.id = IF(ifnull(pnCollectionId, 0) > 0, pnCollectionId, co.id)
             AND ifnull(co.is_trashed, 0) = 0
             AND csm.member_user_id = pnUserId
             AND co.type = 3 -- share only
       ) permission ON (permission.collection_id = cn.collection_id)
    WHERE cn.collection_id = IF(ifnull(pnCollectionId, 0) > 0, pnCollectionId, cn.collection_id)
      AND cn.updated_date < IF(ifnull(pnModifiedLT, 0) > 0, pnModifiedLT, unix_timestamp() + 1)
      AND cn.updated_date >= IF(ifnull(pnModifiedGTE, 0) > 0, pnModifiedGTE, 0)
      AND cn.id > IF(ifnull(pnMinId, 0) > 0, pnMinId, 0)
      AND IF(ifnull(pvCommentIds,'NA') <> 'NA', FIND_IN_SET(cn.id, pvCommentIds), 1)
    GROUP BY cn.id
   ORDER BY 
         --
         (CASE WHEN ifnull(vSort,'') <> '' THEN
               CASE WHEN INSTR(vSort, "-") THEN
                 CASE vFieldSort 
                   WHEN 'action_time' THEN cn.action_time               
                   WHEN 'updated_date' THEN cn.updated_date
          END
          END
               WHEN ifnull(pnModifiedLT, 0) > 0 THEN cn.updated_date
       --
           END) DESC,
        (CASE WHEN ifnull(vSort,'') <> '' THEN
              CASE WHEN INSTR(vSort, "+") THEN
                CASE vFieldSort 
                  WHEN 'action_time' THEN cn.action_time
                  WHEN 'updated_date' THEN cn.updated_date
        END
         END
              WHEN ifnull(pnModifiedGTE, 0) > 0 THEN cn.updated_date 
              WHEN ifnull(pnMinId, 0) > 0 THEN cn.id
             -- ELSE cn.id
          END) ASC
        
   LIMIT pnPageSize
  OFFSET nOFFSET;
  --
END