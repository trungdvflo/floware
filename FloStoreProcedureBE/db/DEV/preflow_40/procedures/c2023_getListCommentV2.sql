CREATE PROCEDURE `c2023_getListCommentV2`(pnCollectionId  BIGINT(20)
                                                          ,pvObjectUid     VARBINARY(1000)
                                                          ,pnUserId        BIGINT(20)
                                                          ,pvUsername      VARCHAR(100)
                                                          ,pvCommentIds    TEXT
                                                          ,pnFilterType    TINYINT(1)
                                                          ,pnModifiedGTE   DOUBLE(14,4)
                                                          ,pnModifiedLT    DOUBLE(14,4)
                                                          ,pnMinId         BIGINT(20)
                                                          ,pnPageSize      INTEGER(11)
                                                          ,pnPageNo        INTEGER(11)
                                                          ,pvSort          VARCHAR(128)
                                                         )
BEGIN
  --
  DECLARE nPageNo           INT(11) DEFAULT ifnull(pnPageNo, 0);
  DECLARE nOFFSET         INT(11) DEFAULT 0;
  DECLARE vFieldSort        VARCHAR(50) DEFAULT REPLACE(REPLACE(IFNULL(pvSort, ''), '-', ''), '+', '');
  -- DEFAULT IS ASC
  DECLARE vSort        VARCHAR(50) DEFAULT IF(IFNULL(pvSort, '') <> '' 
                                    AND NOT instr(pvSort, '-') 
                                     AND NOT instr(pvSort, '+'), concat('+', pvSort), pvSort);
  --
  IF ifnull(pvSort, 'NA') <> 'NA' THEN
    --
    SET nOFFSET = IF(nPageNo > 0, (nPageNo - 1) * pnPageSize, 0);
    --
  END IF;
  SET SESSION group_concat_max_len = 500000;
  --
  SELECT cm.id AS id, cm.collection_activity_id, cm.email, cm.`action`, cm.action_time, cm.`comment`
        ,cm.parent_id, cm.created_date, cm.updated_date
        ,ca.collection_id, ca.object_uid, ca.object_type, IF(ca.object_type = 'URL', '', ca.object_href) object_href
        ,permistion.member_calendar_uri, permistion.member_email, permistion.member_user_id
        ,permistion.owner_user_id, permistion.owner_calendar_uri, permistion.owner_username, permistion.owner_user_id
       -- ,ifnull(fi.attachments, '[]') attachments
        ,ifnull(CONCAT('[',GROUP_CONCAT(
                IF(
                fc.id IS NULL,
                NULL,
                  JSON_OBJECT(
                    'id', fc.id
                    ,'uid', fc.uid
                    ,'filename', fc.filename
                    ,'size', fc.size
                    ,'url', concat('/files-comment/download?uid=', fc.uid)
                    ,'created_date', fc.created_date
                    ,'updated_date', fc.updated_date
                  )
                  )
                ),']'
            ), '[]') attachments
            ,ifnull(CONCAT('[',GROUP_CONCAT(
                IF(
                cm1.id IS NULL,
                NULL,
                  JSON_OBJECT(
                    -- 'mention_text', mu.mention_text
                    'email', mu.email
                  )
                  )
                ),']'
            ), '[]') mentions
     FROM collection_comment cm
     JOIN collection_activity ca ON (cm.collection_activity_id = ca.id)
-- file attachment
LEFT JOIN linked_file_common lfc ON (lfc.source_id = cm.id AND lfc.user_id = cm.user_id)
LEFT JOIN file_common fc ON (lfc.file_common_id = fc.id AND lfc.source_type = 'COMMENT')
-- comment mention
LEFT JOIN comment_mention cm1 ON (cm1.comment_id = cm.id)
LEFT JOIN mention_user mu ON (cm1.mention_user_id = mu.id)
     JOIN (
          -- owner existed collection_id
          SELECT co.id collection_id, co.calendar_uri owner_calendar_uri, co.user_id owner_user_id
                ,'' member_calendar_uri, '' member_email
                ,0 member_user_id
                ,usr.username owner_username
                ,lco.object_uid
            FROM collection co
            JOIN linked_collection_object lco ON (lco.collection_id = co.id)
            JOIN user usr ON (co.user_id = usr.id)
           WHERE co.id      = IF(ifnull(pnCollectionId, 0) > 0, pnCollectionId, co.id)
             AND (co.`type` = 3 OR (pnCollectionId > 0 OR pvObjectUid <> '')) -- owner GET BY uid? dont need TO share
             AND co.user_id = pnUserId
          -- member existed collection_id
          UNION
          SELECT co.id collection_id, co.calendar_uri owner_calendar_uri, co.user_id owner_user_id
                ,csm.calendar_uri member_calendar_uri, csm.shared_email member_email
                ,csm.member_user_id
                ,usr.username owner_username
                ,lco.object_uid
            FROM collection co
            JOIN user usr ON (co.user_id = usr.id)
            JOIN collection_shared_member csm ON (csm.collection_id = co.id AND csm.shared_status = 1) -- JOIN
            JOIN linked_collection_object lco ON (lco.collection_id = co.id)
           WHERE co.id = IF(ifnull(pnCollectionId, 0) > 0, pnCollectionId, co.id)
             AND co.is_trashed = 0
             AND lco.is_trashed = 0
             AND csm.member_user_id = pnUserId
             AND co.type = 3 -- share only
          -- omni
           UNION
          SELECT 0 collection_id, '' owner_calendar_uri, pnUserId owner_user_id
                ,'' member_calendar_uri, '' member_email
                ,0 member_user_id
                ,'' owner_username
                ,'NA' object_uid
            ) permistion ON (permistion.collection_id = ca.collection_id
            AND (permistion.object_uid = ca.object_uid OR permistion.object_uid = 'NA')
            AND (ca.user_id = permistion.owner_user_id OR ca.user_id = permistion.member_user_id))
      
   WHERE ca.collection_id   = IF(ifnull(pnCollectionId, 0) > 0, pnCollectionId, ca.collection_id)
     AND ca.object_uid      = IF(ifnull(pvObjectUid, '') <> '', pvObjectUid, ca.object_uid)
     AND cm.updated_date    < IF(IFNULL(pnModifiedLT, 0) > 0, pnModifiedLT, unix_timestamp() + 1)
     AND cm.updated_date    >= IF(IFNULL(pnModifiedGTE, 0) > 0, pnModifiedGTE, 0)
     AND cm.id > IF(IFNULL(pnMinId, 0) > 0, pnMinId, 0)
     AND IF(IFNULL(pvCommentIds, 'NA') <> 'NA', FIND_IN_SET(cm.id, pvCommentIds), 1)
     -- value = 0 >> ALL comments
     -- value = 1 >> Mentions me
    AND IF(ifnull(pnFilterType, 0) = 1, ifnull(mu.user_id, '') = pnUserId OR ifnull(mu.email, '') = pvUsername, 1)
   GROUP BY cm.id
   -- HAVING 
   ORDER BY 
         --
         (CASE WHEN ifnull(vSort,'') <> '' THEN
               CASE WHEN INSTR(vSort, "-") THEN
                 CASE vFieldSort 
                    WHEN 'action_time' THEN cm.action_time
                    WHEN 'updated_date' THEN cm.updated_date
                    WHEN 'created_date' THEN cm.created_date
                 END
          END
               WHEN IFNULL(pnModifiedLT, 0) > 0 THEN cm.updated_date
       --
           END) DESC,
        (CASE WHEN ifnull(vSort,'') <> '' THEN
              CASE WHEN INSTR(vSort, "+") THEN
                CASE vFieldSort 
                    WHEN 'action_time' THEN cm.action_time
                    WHEN 'updated_date' THEN cm.updated_date
                    WHEN 'created_date' THEN cm.created_date
                END
         END
              WHEN IFNULL(pnModifiedGTE, 0) > 0 THEN cm.updated_date 
              WHEN ifnull(pnMinId, 0) > 0 THEN cm.id
             -- ELSE cm.id
          END) ASC
        
   LIMIT pnPageSize
  OFFSET nOFFSET;
  --
  SET SESSION group_concat_max_len = 1024;
--
END