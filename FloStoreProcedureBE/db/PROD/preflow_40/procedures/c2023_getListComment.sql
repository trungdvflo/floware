CREATE PROCEDURE `c2023_getListComment`(nCollectionId  BIGINT(20)
                                                          ,vObjectUid     VARBINARY(1000)
                                                          ,nUserId        BIGINT(20)
                                                          ,vIDs           TEXT
                                                          ,nModifiedGTE   DOUBLE(14,4)
                                                          ,nModifiedLT    DOUBLE(14,4)
                                                          ,nMinId         BIGINT(20)
                                                          ,nPageSize      INTEGER(11)
                                                          ,nPageNo        INTEGER(11)
                                                          ,vSort          VARCHAR(128)
                                                         )
BEGIN
  --
  DECLARE nOFFSET INT(11) DEFAULT 0;
  DECLARE vFieldSort    VARCHAR(50) DEFAULT REPLACE(REPLACE(IFNULL(vSort, ''), '-', ''), '+', '');
  -- DEFAULT IS ASC
  DECLARE pvSort        VARCHAR(50) DEFAULT IF(IFNULL(vSort, '') <> '' 
                         AND NOT instr(vSort, '-') 
                                               AND NOT instr(vSort, '+'), concat('+', vSort), vSort);
  --
  IF ifnull(vSort, 'NA') <> 'NA' THEN
    --
    SET nOFFSET = IF(ifnull(nPageNo, 0) = 0, 0, (nPageNo - 1) * nPageSize);
    --
  END IF;
  SET SESSION group_concat_max_len = 500000;
  --
  SELECT cm.id AS id, cm.collection_activity_id, cm.email, cm.action, cm.action_time, cm.comment
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
     FROM collection_comment cm
     JOIN collection_activity ca ON (cm.collection_activity_id = ca.id)
LEFT JOIN linked_file_common lfc ON (lfc.source_id = cm.id AND lfc.user_id = cm.user_id)
LEFT JOIN file_common fc ON (lfc.file_common_id = fc.id AND lfc.source_type = 'COMMENT')
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
           WHERE co.id = IF(ifnull(nCollectionId, 0) > 0, nCollectionId, co.id)
             AND co.`type` = IF(ifnull(nCollectionId, 0) > 0 OR ifnull(vObjectUid, '') <> '', co.`type`, 3) -- owner GET BY uid? dont need TO share
             AND co.user_id = nUserId
          -- member existed collection_id
          UNION
          SELECT co.id collection_id, co.calendar_uri owner_calendar_uri, co.user_id owner_user_id
                ,csm.calendar_uri member_calendar_uri, csm.shared_email member_email
                ,csm.member_user_id
                ,usr.username owner_username
                ,lco.object_uid
            FROM collection co
            JOIN user usr ON (co.user_id = usr.id)
            JOIN collection_shared_member csm ON (csm.collection_id = co.id AND csm.shared_status = 1)
            JOIN linked_collection_object lco ON (lco.collection_id = co.id)
           WHERE co.id = IF(ifnull(nCollectionId, 0) > 0, nCollectionId, co.id)
             AND ifnull(co.is_trashed, 0) = 0
             AND ifnull(lco.is_trashed, 0) = 0
             AND csm.member_user_id = nUserId
             AND co.type = 3 -- share only
          -- omni
           UNION
          SELECT 0 collection_id, '' owner_calendar_uri, nUserId owner_user_id
                ,'' member_calendar_uri, '' member_email
                ,0 member_user_id
                ,'' owner_username
                ,'NA' object_uid
            ) permistion ON (permistion.collection_id = ca.collection_id
            AND (permistion.object_uid = ca.object_uid OR permistion.object_uid = 'NA')
            AND (ca.user_id = permistion.owner_user_id OR ca.user_id = permistion.member_user_id))
      
   WHERE ca.collection_id = IF(ifnull(nCollectionId, 0) > 0, nCollectionId, ca.collection_id)
     AND ca.object_uid = IF(ifnull(vObjectUid, '') <> '', vObjectUid, ca.object_uid)
     AND cm.updated_date < IF(ifnull(nModifiedLT, 0) > 0, nModifiedLT, unix_timestamp() + 1)
     AND cm.updated_date >= IF(ifnull(nModifiedGTE, 0) > 0, nModifiedGTE, 0)
     AND cm.id > IF(ifnull(nMinId, 0) > 0, nMinId, 0)
     AND IF(ifnull(vIDs,'NA' <>'NA'), FIND_IN_SET(cm.id, vIDs), 1)
   GROUP BY cm.id
   ORDER BY 
         --
         (CASE WHEN ifnull(pvSort,'') <> '' THEN
               CASE WHEN INSTR(pvSort, "-") THEN
                 CASE vFieldSort WHEN 'action_time' THEN cm.action_time END
          END
               WHEN ifnull(nModifiedLT, 0) > 0 THEN cm.updated_date
       --
           END) DESC,
        (CASE WHEN ifnull(pvSort,'') <> '' THEN
              CASE WHEN INSTR(pvSort, "+") THEN
                CASE vFieldSort WHEN 'action_time' THEN cm.action_time END
         END
              WHEN ifnull(nModifiedGTE, 0) > 0 THEN cm.updated_date 
              WHEN ifnull(nMinId, 0) > 0 THEN cm.id
             -- ELSE cm.id
          END) ASC
        
   LIMIT nPageSize
  OFFSET nOFFSET;
  --
  SET SESSION group_concat_max_len = 1024;
--
END