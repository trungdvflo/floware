CREATE PROCEDURE `n2023_updateNotificationStatusForUser`(pnNotiID      BIGINT(20)
                                                                          ,pnStatus      TINYINT(2)
                                                                          ,pdActionTime  DOUBLE(13,3)
                                                                          ,pnUserID      BIGINT(20)
                                                                          )
n2023_updateNotificationStatusForUser:BEGIN
  --
  DECLARE nID       INT(11);
  DECLARE isOwner   boolean;
  DECLARE isMember  boolean;
  DECLARE isTrash   TINYINT(1) DEFAULT 0;
  --
   SELECT co.user_id = pnUserID
         ,csm.member_user_id = pnUserID AND shared_status = 1
         ,co.is_trashed
     INTO isOwner, isMember, isTrash
     FROM collection co
     JOIN collection_shared_member csm ON (co.id = csm.collection_id)
     JOIN collection_notification cn ON (csm.collection_id = cn.collection_id)
    WHERE cn.id = pnNotiID
    LIMIT 1; -- joined
  -- CHECK permission
  IF isTrash > 0 OR (isOwner = 0 AND isMember = 0) THEN
    --
    SELECT 0 id;
    LEAVE n2023_updateNotificationStatusForUser;
    --
  END IF;
  --
  SELECT ifnull(max(un.id), 0)
    INTO nID
    FROM user_notification un
   WHERE un.collection_notification_id = pnNotiID
     AND un.user_id = pnUserID;
  --
  IF nID > 0 THEN
    --
    UPDATE user_notification un
        SET un.status = pnStatus
           ,un.updated_date = unix_timestamp(now(3))
           ,un.action_time = ifnull(pdActionTime, 0)
        WHERE un.id = nID;
    --
  ELSE
    --
    INSERT INTO user_notification
          (user_id, collection_notification_id, status, action_time, created_date, updated_date)
    VALUES
          (pnUserID, pnNotiID, pnStatus, ifnull(pdActionTime, 0),  unix_timestamp(now(3)), unix_timestamp(now(3)));
    --
    SELECT last_insert_id() INTO nID;
    --
  END IF;
  --
  SELECT cn.id, cn.email, cn.collection_id, cn.object_uid, cn.object_type
         ,cn.content
         ,cn.comment_id, cn.created_date
         ,ifnull(un.action_time, 0) action_time
         ,ifnull(un.updated_date, 0) updated_date
         ,ifnull(un.`status`, 0) `status`
     FROM collection_notification cn
     JOIN user_notification un ON (cn.id = un.collection_notification_id)
    WHERE un.collection_notification_id = pnNotiID
      AND un.user_id = pnUserID
      AND cn.id = pnNotiID;
  --
END