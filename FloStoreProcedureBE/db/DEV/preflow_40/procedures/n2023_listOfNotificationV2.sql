CREATE PROCEDURE `n2023_listOfNotificationV2`(
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
,pvStatus        VARCHAR(20)    -- AND 0: ALL (DEFAULT) - 1: New - 2: READ - 3: Unread
,pvObjectType    VARBINARY(250) -- OR VEVENT, VTODO, VJOURNAL, URL
,pvAction        VARCHAR(100)   -- OR
,pvAssignment    VARCHAR(20)    -- OR 0: ALL (DEFAULT) - 1: NOT Assigned - 2: Assigned TO Me - 3: Assigned BY Me
)
BEGIN
  -- only SHOW notification edited FOR mentioned member
  DECLARE vStatus           VARCHAR(20) DEFAULT ifnull(pvStatus, '0');
  DECLARE vAssignment       VARCHAR(20) DEFAULT ifnull(pvAssignment, '0');
  DECLARE nOFFSET           INT(11) DEFAULT 0;
  DECLARE vFieldSort        VARCHAR(50) DEFAULT REPLACE(REPLACE(IFNULL(pvSort, ''), '-', ''), '+', '');
  -- DEFAULT IS ASC
 DECLARE vSort              VARCHAR(50) DEFAULT IF(IFNULL(pvSort, '') <> '' -- DEFAULT +: ASC
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
         ,IF((cn.action = 6 OR cn.action = 61) AND un.has_mention = 1, 63, cn.action) `action`
         ,cn.content, cn.action_time, cn.comment_id, cn.created_date, greatest(cn.updated_date, ifnull(un.updated_date, 0)) updated_date
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
          ,ifnull(un.`status`, 0) `status`
          ,cn.assignees
     FROM collection_notification cn
LEFT JOIN user_notification un ON (un.collection_notification_id = cn.id AND un.user_id = pnUserId)
-- LEFT JOIN collection_comment cm ON (cn.comment_id = cm.id)
-- LEFT JOIN comment_mention cm1 ON (cm1.comment_id = cm.id)
-- LEFT JOIN mention_user mu ON (cm1.mention_user_id = mu.id AND (mu.user_id = pnUserId OR mu.email = pvUsername))
--
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
      AND (
          cn.updated_date < IF(ifnull(pnModifiedLT, 0) > 0, pnModifiedLT, unix_timestamp() + 1)
          OR
          un.updated_date < IF(ifnull(pnModifiedLT, 0) > 0, pnModifiedLT, unix_timestamp() + 1)
          )
      AND (
          cn.updated_date >= IF(ifnull(pnModifiedGTE, 0) > 0, pnModifiedGTE, 0)
          OR
          un.updated_date >= IF(ifnull(pnModifiedGTE, 0) > 0, pnModifiedGTE, 0)
          )
      AND cn.id > IF(ifnull(pnMinId, 0) > 0, pnMinId, 0)
      AND un.deleted_date IS NULL -- sprint 17.2 soft DELETE notification
      AND IF(ifnull(pvCommentIds,'NA') <> 'NA', FIND_IN_SET(cn.id, pvCommentIds), 1)
        AND IF(isnull(pvAction), 1,
          CASE WHEN find_in_set(6, pvAction)
            THEN
              (cn.action = 61 AND un.has_mention = 1) OR find_in_set(cn.`action`, pvAction)
            ELSE
              find_in_set(cn.`action`, pvAction)
            END
        )
        -- only GET noti UPDATE comment FOR CASE mention
        AND IF(cn.action = 61, un.has_mention = 1, 1)
        AND IF(isnull(pvObjectType), 1, find_in_set(cn.object_type, pvObjectType))
      -- 0: ALL (DEFAULT) 
      AND (find_in_set(0, vStatus)
          OR (-- 1: New 
              IF(find_in_set(1, vStatus), unix_timestamp(now(3) - INTERVAL 1 day) <= cn.created_date, 1)
              -- 2: READ 
              AND IF(find_in_set(2, vStatus), ifnull(un.status, 0) = 1, 1)
              -- 3: Unread
              AND IF(find_in_set(3, vStatus), ifnull(un.status, 0) = 0, 1)
              -- 4: Closed
              AND IF(find_in_set(4, vStatus), ifnull(un.status, 0) = 2, 1)
              )
         )
      -- 0: ALL (DEFAULT) 
      AND (find_in_set(0, vAssignment)
           OR (
           cn.object_type='VTODO' AND (
           -- 4: ALL VTODO
              find_in_set(4, vAssignment)
           -- 1: NOT Assigned
           OR (find_in_set(1, vAssignment) AND (ifnull(cn.assignees, '') = '' OR cn.action = 18)) -- 18 >> Un-Assigned 
           -- 2: Assigned TO Me 
           OR (find_in_set(2, vAssignment) AND cn.action = 17 AND find_in_set(pvUsername, ifnull(cn.assignees, 'NA')))
           -- 3: Assigned BY Me
           OR (find_in_set(3, vAssignment) AND cn.email = pvUsername AND cn.action = 17)
           )
         )
       )
   GROUP BY cn.id
   ORDER BY
        (CASE
           --
           WHEN isnull(pnMinId) AND INSTR(vSort, "-") THEN
             --
             CASE vFieldSort
               --
               WHEN 'action_time' THEN cn.action_time               
               WHEN 'updated_date' THEN cn.updated_date
               --
             END
           WHEN NOT isnull(pnModifiedLT) THEN cn.updated_date
           --
         END) DESC,
        (CASE
           --
           WHEN NOT isnull(pnMinId) THEN cn.id
           WHEN NOT isnull(pnModifiedGTE) THEN cn.updated_date
           WHEN isnull(pnMinId) AND INSTR(vSort, "+") THEN
             --
             CASE vFieldSort 
               --
               WHEN 'action_time' THEN cn.action_time               
               WHEN 'updated_date' THEN cn.updated_date
               --
              END
           --
         END) ASC
        
   LIMIT pnPageSize
  OFFSET nOFFSET;
  --
END