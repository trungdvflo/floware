CREATE PROCEDURE `c2022_createChannelV2`(pnUserId         BIGINT(20)
                                                               ,pvUid           VARBINARY(1000)
                                                               ,pvEmail         VARCHAR(100)
                                                               ,pvTitle         VARCHAR(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                               ,pvDescription   VARCHAR(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                               ,pvAvatar        TEXT
                                                               ,pnVip           TINYINT(1)
                                                               ,pvRoomUrl       VARCHAR(2000)
                                                               ,pnCreatedDate   DOUBLE(13,3)
                                                               ,pnUpdatedDate   DOUBLE(13,3)
                                                               ,pnEnableChatHistory TINYINT(1))
BEGIN
  --
  DECLARE nchannelId             BIGINT(20) DEFAULT 0;
  DECLARE nMemberId              BIGINT(20) DEFAULT 0;
  DECLARE nEnableChatHistory     BIGINT(20) DEFAULT ifnull(pnEnableChatHistory, 1);
  START TRANSACTION;
  --
  --
  --
  -- CHECK existed creator
    # CREATE new WHEN no id supply
     INSERT INTO conference_channel
    (user_id, title, uid, room_url, enable_chat_history, created_date, updated_date)
    VALUES
    (pnUserId, pvTitle, pvUid, ifnull(pvRoomUrl, ''), nEnableChatHistory, pnCreatedDate, pnUpdatedDate);
    #
    SELECT LAST_INSERT_ID() INTO nchannelId;
    IF ifnull(nchannelId,0) = 0 THEN
      ROLLBACK;
      SELECT 0;
    END IF;
      --
    INSERT INTO conference_member
      (user_id, channel_id, email, created_by, is_creator, title, description, avatar, vip, view_chat_history, join_time, created_date,    updated_date)
    VALUES
      (pnUserId, nchannelId, pvEmail, pvEmail, 1, pvTitle, pvDescription, pvAvatar, ifnull(pnVip, 0), nEnableChatHistory, pnCreatedDate, pnCreatedDate, pnUpdatedDate);
    -- ON DUPLICATE KEY UPDATE updated_date = unix_timestamp();
    SELECT LAST_INSERT_ID() INTO nMemberId;
  #
  SELECT cm.id id, cc.room_url
             ,cm.vip, cm.email, cm.is_creator, cc.uid
              ,COALESCE(cm.title, cc.title) title
             ,cm.created_date, cm.updated_date, ifnull(cm.revoke_time,0) revoke_time
             ,nchannelId channel_id
             ,ifnull(cc.enable_chat_history, 1) enable_chat_history
             ,ifnull(cm.view_chat_history, 1) view_chat_history
         FROM conference_channel cc
         JOIN conference_member cm ON (cc.id = cm.channel_id)
        WHERE cc.id = nchannelId
          AND cm.id = nMemberId;
    --
    COMMIT;
END