CREATE FUNCTION `n2023_createUserNotification`(pnNotiID       BIGINT(20)
,pnStatus       TINYINT(2)
,pdActionTime   DOUBLE(13,3)
,pnUpdatedDate  DOUBLE(13,3)
,pnDeletedDate  DOUBLE(13,3)
,pnUserID       BIGINT(20)
) RETURNS INT(11)
BEGIN
  --
  DECLARE nID            INT(11);
  --
  SELECT ifnull(max(un.id), 0)
    INTO nID
    FROM user_notification un
   WHERE un.collection_notification_id = pnNotiID
     AND un.user_id = pnUserID;
  --
  IF nID > 0 THEN
    -- UPDATE existing UN
    UPDATE user_notification un
        SET un.status     = ifnull(pnStatus, un.status)
           ,un.updated_date = ifnull(nUpdatedDate, un.updated_date)
           ,un.action_time   = ifnull(pdActionTime, action_time)
           ,un.deleted_date = ifnull(pnDeletedDate, deleted_date)
        WHERE un.id = nID;
    --
  ELSE
    -- CREATE new UN
    INSERT INTO user_notification
          (user_id, collection_notification_id, status, action_time, created_date, updated_date, deleted_date)
    VALUES
          (pnUserID, pnNotiID, pnStatus, ifnull(pdActionTime, 0),  nUpdatedDate, nUpdatedDate, pnDeletedDate);
    --
    SELECT last_insert_id() INTO nID;
    --
  END IF;
  --
  RETURN nID;
  --
END