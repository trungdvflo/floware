CREATE PROCEDURE `c2023_listOfCollectionHistoryV2`(pnCollectionId    BIGINT(20)
                                                                 ,pvObjectUid     VARBINARY(1000)
                                                                 ,pnUserId        BIGINT(20)
                                                                 ,pvIDs           TEXT
                                                                 ,pnModifiedGTE   DOUBLE(14,4)
                                                                 ,pnModifiedLT    DOUBLE(14,4)
                                                                 ,pnMinId         BIGINT(20)
                                                                 ,pnPageSize      INTEGER(11)
                                                                 ,pnPageNo        INTEGER(11)
                                                                 ,pvSort          VARCHAR(128))
BEGIN
  -- 
  DECLARE nPageNo           INT(11) DEFAULT ifnull(pnPageNo, 0);
  DECLARE nCollectionId     INT(11) DEFAULT ifnull(pnCollectionId, 0);
  DECLARE vObjectUid        VARBINARY(1000) DEFAULT ifnull(pvObjectUid, '');
  DECLARE nOFFSET           INT(11)   DEFAULT 0;
  DECLARE nModifiedLT       DOUBLE(14,4) DEFAULT ifnull(pnModifiedLT, 0);
  DECLARE nModifiedGTE      DOUBLE(14,4) DEFAULT ifnull(pnModifiedGTE, 0);
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
  --
  SELECT ch.id AS id, ch.collection_activity_id, ch.email, ch.action, ch.action_time, ch.content
        ,ch.created_date, ch.updated_date, ch.assignees
        ,ca.collection_id, ca.object_uid, ca.object_type, IF(ca.object_type = 'URL', '', ca.object_href) object_href
        ,permistion.member_calendar_uri, permistion.member_email, permistion.member_user_id
        ,permistion.owner_user_id, permistion.owner_calendar_uri, permistion.owner_username, permistion.owner_user_id
    FROM collection_history ch
    JOIN collection_activity ca ON (ch.collection_activity_id = ca.id)
    JOIN (
          -- owner existed collection_id
          SELECT co.id collection_id, co.calendar_uri owner_calendar_uri, co.user_id owner_user_id
                ,'' member_calendar_uri, '' member_email
                ,0 member_user_id
                ,usr.username owner_username
                ,lco.object_uid
            FROM collection co
            JOIN user usr ON (co.user_id = usr.id)
            JOIN linked_collection_object lco ON (lco.collection_id = co.id)
           WHERE co.id = IF(nCollectionId > 0, nCollectionId, co.id)
             AND co.`type` = IF(nCollectionId > 0 OR vObjectUid <> '', co.`type`, 3) -- owner GET BY uid? dont need TO share
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
            JOIN collection_shared_member csm ON (csm.collection_id = co.id AND csm.shared_status = 1)
            JOIN linked_collection_object lco ON (lco.collection_id = co.id)
           WHERE co.id = IF(nCollectionId > 0, nCollectionId, co.id)
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
      
   WHERE ca.collection_id = IF(nCollectionId > 0, nCollectionId, ca.collection_id)
     AND ca.object_uid = IF(vObjectUid <> '', vObjectUid, ca.object_uid)
     AND ch.updated_date < IF(nModifiedLT > 0, nModifiedLT, unix_timestamp() + 1)
     AND ch.updated_date >= IF(nModifiedGTE > 0, nModifiedGTE, 0)
     AND ch.id > IF(ifnull(pnMinId, 0) > 0, pnMinId, 0)
     AND IF(ifnull(pvIDs,'NA' <>'NA'), FIND_IN_SET(ch.id, pvIDs), 1)
   GROUP BY ch.id
    ORDER BY 
         --
         (CASE WHEN ifnull(vSort,'') <> '' THEN
               CASE WHEN INSTR(vSort, "-") THEN
                 CASE vFieldSort WHEN 'action_time' THEN ch.action_time END
                END
               WHEN nModifiedLT > 0 THEN ch.updated_date
           --
           END) DESC,
        (CASE WHEN ifnull(vSort,'') <> '' THEN
              CASE WHEN INSTR(vSort, "+") THEN
                CASE vFieldSort WHEN 'action_time' THEN ch.action_time END
              END
              WHEN nModifiedGTE > 0 THEN ch.updated_date 
              WHEN ifnull(pnMinId, 0) > 0 THEN ch.id
             -- ELSE ch.id
          END) ASC
         --
   LIMIT pnPageSize
  OFFSET nOFFSET;
--
END