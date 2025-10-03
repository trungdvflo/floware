CREATE PROCEDURE `c2023_updateChannel`(memberId      BIGINT(20)
                                                              ,userId        BIGINT(20)
                                                              ,title         VARCHAR(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                              ,shareTitle    VARCHAR(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                              ,description   VARCHAR(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                                                              ,avatar        TEXT
                                                              ,vip           TINYINT(1)
                                                              ,roomUrl       VARCHAR(2000)
                                                              ,updatedDate   DOUBLE(13,3)
                                                              ,pnEnableChatHistory TINYINT(1))
BEGIN
--
--
  DECLARE nMemberID   BIGINT(20);
  DECLARE nChannelId  BIGINT(20);
  DECLARE isCreator   TINYINT(1);
  -- verify existed member
  SELECT cm.id, cm.channel_id, cm.is_creator
    INTO nMemberID, nChannelId, isCreator
    FROM conference_member cm
   WHERE cm.id = memberId
     AND cm.user_id = userId;
  -- 
  IF ifnull(nMemberID, 0) = 0 THEN
    SELECT 0 id;
  ELSE
    -- UPDATE WHEN supply id
    UPDATE conference_member cp
       SET cp.title            = CASE WHEN ifnull(title, 'NA') = 'NA' THEN cp.title ELSE title END
          ,cp.description      = CASE WHEN ifnull(description, 'NA') = 'NA' THEN cp.description ELSE description END
          ,cp.avatar           = CASE WHEN ifnull(avatar, 'NA') = 'NA' THEN cp.avatar ELSE avatar END
          ,cp.vip              = CASE WHEN ifnull(vip, 'NA') = 'NA' THEN cp.vip ELSE vip END
          ,cp.updated_date     = updatedDate
     WHERE cp.id            = memberId
       AND cp.user_id       = userId
       AND cp.channel_id    = nChannelId;
    --
    IF ifnull(isCreator, 0) > 0  THEN
      -- only owner can allow UPDATE room_url, shared title, enable_chat_history
     UPDATE conference_channel cc
        SET cc.room_url = COALESCE(roomUrl, room_url)
           ,cc.enable_chat_history = COALESCE(pnEnableChatHistory, enable_chat_history)
           ,cc.title = COALESCE(shareTitle, cc.title)
           ,cc.updated_date     = updatedDate
        WHERE cc.id = nChannelId;
      --
    END IF;
    --
    SELECT cm.id id, cc.room_url
             ,cm.vip, cm.email, cm.is_creator, cc.uid, cm.created_date, cm.updated_date, ifnull(cm.revoke_time,0) revoke_time
             ,nChannelId channel_id
             ,COALESCE(cm.title, cc.title, '') title -- ,cm.title,
             ,cc.title share_title
              ,cc.enable_chat_history
         FROM conference_channel cc
         JOIN conference_member cm ON (cc.id = cm.channel_id)
        WHERE cc.id = nChannelId
          AND cm.id = nMemberId;
    --
  END IF;
END