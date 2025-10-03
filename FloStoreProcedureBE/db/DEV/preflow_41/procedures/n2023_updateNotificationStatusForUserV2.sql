CREATE PROCEDURE `n2023_updateNotificationStatusForUserV2`(pnNotiID      BIGINT(20)
                                                                          ,pnStatus       TINYINT(2)
                                                                          ,pdActionTime   DOUBLE(13,3)
                                                                          ,pnUpdatedDate  DOUBLE(13,3)
                                                                          ,pnUserID       BIGINT(20)
                                                                          )
n2023_updateNotificationStatusForUser:BEGIN
  --
  DECLARE nID            INT(11);
  DECLARE nReturn        INT(11);
  DECLARE isOwner        boolean;
  DECLARE isMember       boolean;
  DECLARE isTrash        TINYINT(1) DEFAULT 0;
  DECLARE nUpdatedDate   DOUBLE(13,3) DEFAULT ifnull(pnUpdatedDate, unix_timestamp(now(3)));
  DECLARE nPermission         TINYINT(1) DEFAULT 0;
  DECLARE nCollectionID       BIGINT(20) DEFAULT 0;
  --
  SELECT co.user_id = pnUserID
        ,csm.member_user_id = pnUserID AND shared_status = 1
        ,co.is_trashed, co.id
    INTO isOwner, isMember, isTrash, nCollectionID
    FROM collection co
    JOIN collection_shared_member csm ON (co.id = csm.collection_id)
    JOIN collection_notification cn ON (csm.collection_id = cn.collection_id)
   WHERE cn.id = pnNotiID
     AND (co.user_id = pnUserID OR member_user_id = pnUserID)
   LIMIT 1; -- joined
  -- 
  SET nPermission = c2023_checkCollectionPermistion(nCollectionID, pnUserId);
  --
  IF nPermission < 1 THEN
    -- 
    SELECT nPermission id;
    LEAVE n2023_updateNotificationStatusForUser;
    --
  END IF; 
  -- CHECK permission
  IF isTrash > 0 OR (isOwner = 0 AND isMember = 0) THEN
    --
    SELECT 0 id;
    LEAVE n2023_updateNotificationStatusForUser;
    --
  END IF;
  --
  SET nID = n2023_createUserNotification(pnNotiID, pnStatus, 0, pdActionTime, pnUpdatedDate, NULL, pnUserID);
  -- CHECK deleted notification
  IF nID <= 0 THEN
    --
    SELECT nID id;
    LEAVE n2023_updateNotificationStatusForUser;
    --
  END IF;
  --
  SELECT cn.id, cn.email, cn.collection_id, cn.object_uid, cn.object_type
         ,cn.content
         ,cn.comment_id, cn.created_date
         ,ifnull(un.action_time, 0) action_time
         ,un.updated_date
         ,ifnull(un.`status`, 0) `status`
     FROM collection_notification cn
     JOIN user_notification un ON (cn.id = un.collection_notification_id)
    WHERE un.collection_notification_id = pnNotiID
      AND un.user_id = pnUserID
      AND cn.id = pnNotiID;
  --
END