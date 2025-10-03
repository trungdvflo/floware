CREATE PROCEDURE `conference_createChannel`(pnUserId         BIGINT(20)
                                                               ,pvUid           VARBINARY(1000)
                                                               ,pvEmail         VARCHAR(100)
                                                               ,pvTitle         VARCHAR(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                               ,pvDescription   VARCHAR(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                               ,pvAvatar        TEXT
                                                               ,pnVip           TINYINT(1)
                                                               ,pvRoomUrl       VARCHAR(2000)
                                                               ,pnCreatedDate   DOUBLE(13,3)
                                                               ,pnUpdatedDate   DOUBLE(13,3))
BEGIN
  --
  DECLARE nchannelId    BIGINT(20) DEFAULT 0;
  DECLARE nMemberId     BIGINT(20) DEFAULT 0;
  START TRANSACTION;
  --
  --
  --
  -- CHECK existed creator
    # CREATE new WHEN no id supply
    INSERT INTO conference_channel
    (user_id, title, room_url, created_date, updated_date)
    VALUES
    (pnUserId, pvTitle, ifnull(pvRoomUrl, ''), pnCreatedDate, pnUpdatedDate);
    #
    SELECT LAST_INSERT_ID() INTO nchannelId;
    IF ifnull(nchannelId,0) = 0 THEN
      ROLLBACK;
      SELECT 0;
    END IF;
      --
    INSERT INTO conference_member
      (user_id, channel_id, uid, email, is_creator, title, description, avatar, vip, created_date,    updated_date)
    VALUES
      (pnUserId, nchannelId,  pvUid, pvEmail,          1, pvTitle, pvDescription, pvAvatar, ifnull(pnVip, 0), pnCreatedDate, pnUpdatedDate);
    -- ON DUPLICATE KEY UPDATE updated_date = unix_timestamp();
    SELECT LAST_INSERT_ID() INTO nMemberId;
  #
  SELECT cm.id id, cc.room_url
             ,cm.vip, cm.email, cm.is_creator, cm.uid
              ,COALESCE(cm.title, cc.title) title
             ,cm.created_date, cm.updated_date, ifnull(cm.revoke_time,0) revoke_time
             ,nchannelId channel_id
         FROM conference_channel cc
         JOIN conference_member cm ON (cc.id = cm.channel_id)
        WHERE cc.id = nchannelId
          AND cm.id = nMemberId;
    --
    COMMIT;
END