CREATE FUNCTION `n2023_checkToPermanentlyDeleteNotification`(
 pnNotiID       INT
,pnCollectionID BIGINT(20)) RETURNS INT(11)
BEGIN
  --
  DECLARE nShared  TINYINT(1) DEFAULT -1;
  DECLARE nReturn  INT;
  -- LEFT OUTER JOIN TO GET ALL members haven't DELETE this notification yet
  SELECT ifnull(max(csm.member_user_id), 0) > 0
    INTO nShared
    FROM (SELECT co.user_id member_user_id, co.id collection_id
            FROM collection co -- owner
           WHERE co.id = pnCollectionID
           UNION
          SELECT csm.member_user_id, csm.collection_id
            FROM collection_shared_member csm -- member
           WHERE csm.collection_id = pnCollectionID          
          ) csm
    LEFT JOIN (SELECT un.id, cn.collection_id, un.user_id
                 FROM user_notification un
                 JOIN collection_notification cn ON (cn.id = un.collection_notification_id)
                WHERE cn.id = pnNotiID
                  AND cn.collection_id = pnCollectionID
                  AND un.deleted_date IS NOT NULL
               ) un ON (csm.member_user_id = un.user_id AND csm.collection_id = un.collection_id)
        WHERE un.id IS NULL; -- 
  --
  IF nShared = 0 THEN
    -- no one care about this notification any more -> let detele permanently
    SET nReturn = n2023_permanentlyDeleteCollectionNotification(pnNotiID, pnCollectionID);
    --
    RETURN nReturn;
    --
  END IF;
  --
  RETURN 0;
  --
END