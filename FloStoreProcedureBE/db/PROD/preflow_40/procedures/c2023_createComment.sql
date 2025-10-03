CREATE PROCEDURE `c2023_createComment`(pnID                  BIGINT(20)
,pnCollectionId         BIGINT(20)
,pvObjectUid            VARBINARY(1000)
,pvObjectHref           TEXT
,pvObjectType           VARBINARY(50)
,pnUserId              BIGINT(20)
,pnActionTime           DOUBLE(13,3)
,pvComment             TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
,pnParentId             BIGINT(20) 
,pnCreatedDate          DOUBLE(13,3)
,pnUpdatedDate          DOUBLE(13,3))
sp_createComment: BEGIN
  -- DEPRECATED
  DECLARE nCommentID    BIGINT(20) DEFAULT 0;
  --
  START TRANSACTION;
  --
  IF ifnull(pnID, 0) > 0 THEN
    --
    SET nCommentID = c2023_updateComment(pnID, pnUserId, pnActionTime, pvComment, pnUpdatedDate);
    --
  ELSE
    --
    SET nCommentID = c2023_createComment(pnCollectionId, pvObjectUid, pvObjectType
                            ,pnUserId, pnActionTime, pvComment, pnParentId, pnCreatedDate, pnUpdatedDate);
    --
  END IF;
  --
  COMMIT;
  --
  IF ifnull(nCommentID, 0) < 1 THEN
    --
      SELECT nCommentID id;
      LEAVE sp_createComment;
    --
  END IF;
    
  -- RETURN value
  SELECT ca.collection_id, ca.object_uid, ca.object_type, ca.object_href
        ,cc.id, cc.collection_activity_id
        ,cc.email, cc.action, cc.action_time
        ,cc.comment, cc.parent_id
        ,cc.created_date, cc.updated_date
        ,co.user_id owner_user_id
        ,csm.calendar_uri member_calendar_uri
        ,csm.shared_email member_email
        ,co.calendar_uri owner_calendar_uri
        ,u.username owner_username
    FROM collection_comment cc
    JOIN collection_activity ca ON (ca.id = cc.collection_activity_id)
    JOIN collection co ON (ca.collection_id = co.id)
    LEFT JOIN collection_shared_member csm ON (co.id = csm.collection_id)
    JOIN user u ON (u.id = co.user_id)
   WHERE cc.id = nCommentID
     AND (co.user_id = pnUserId
           OR csm.member_user_id = pnUserId)
     AND co.id = CASE 
                   WHEN ifnull(pnCollectionId, 0) = 0 
                   THEN ca.collection_id ELSE pnCollectionId 
                  END
        GROUP BY cc.id
       UNION
      SELECT ca.collection_id, ca.object_uid, ca.object_type, ca.object_href
        ,cc.id, cc.collection_activity_id
        ,cc.email, cc.action, cc.action_time
        ,cc.comment, cc.parent_id
        ,cc.created_date, cc.updated_date
        ,0 owner_user_id
        ,'' member_calendar_uri
        ,'' member_email
        ,'' owner_calendar_uri
        ,u.username owner_username
    FROM collection_comment cc
    JOIN collection_activity ca ON (ca.id = cc.collection_activity_id)
    JOIN user u ON (u.id = ca.user_id)
   WHERE cc.id = nCommentID
     AND ca.collection_id = 0
     AND ca.user_id = pnUserId
    GROUP BY cc.id;
--
END