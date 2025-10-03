CREATE PROCEDURE `c2022_leaveChannel`(memberId     BIGINT(20)
                                                             ,userId       BIGINT(20)
                                                             ,itemType     VARBINARY(50)
                                                             ,deleteTime   DOUBLE(13,3))
BEGIN
  --
  --
  DECLARE nchannelId      BIGINT(20) DEFAULT 0;
  DECLARE vEmail          VARCHAR(100);
  DECLARE vUid            VARCHAR(255);
  DECLARE nMemberID       BIGINT(20) DEFAULT 0;
  DECLARE nUserId         BIGINT(20) DEFAULT 0;
  DECLARE nCount          INTEGER DEFAULT 0;
  DECLARE nRETURN         INTEGER DEFAULT 0;
  DECLARE nRevokeRime     DOUBLE(13,3) DEFAULT 0;
  DECLARE vMTitle         VARCHAR(2000);
  DECLARE vCTitle         VARCHAR(2000);
  -- 1. verify existed member
  SELECT cm.id, cc.uid, cm.channel_id, cm.user_id, cm.email, cm.revoke_time
        ,cc.title, cm.title
    INTO nMemberID, vUid, nchannelId, nUserId, vEmail, nRevokeRime
        ,vCTitle, vMTitle
    FROM conference_member cm
    JOIN conference_channel cc ON (cc.id = cm.channel_id)
   WHERE cm.id = memberId
     AND cm.user_id = userId;
  -- 
  IF ifnull(nMemberID, 0) > 0 THEN
    -- 2. REVOKE member
    DELETE FROM conference_member
     WHERE id = nMemberID
       AND user_id = nUserId;
    -- 3. save TO deleted item
    INSERT INTO deleted_item
          (item_id, item_type, user_id,  item_uid, is_recovery, created_date, updated_date)
    value (nMemberID, itemType, nUserId,      vUid,           0,  deleteTime, deleteTime);
    -- 3.5 save TO deleted item FOR member
    SET nRETURN = d2022_genDeletedItemForConferenceMember(nchannelId, nMemberID, nUserId, deleteTime);
    -- 4. remove ALL link
    SET nRETURN = c2022_removeLinkedChannel(vUid, nUserId, deleteTime);
    -- 5. CHECK remove last member
    SELECT count(cm.id)
      INTO nCount
      FROM conference_member cm
     WHERE cm.channel_id = nchannelId;
    -- 5.1. IF this IS last member -> detele channel too
    IF nCount = 0 THEN
      --
      DELETE FROM conference_channel
       WHERE id = nchannelId;
      --
    END IF;
    --
    SELECT nMemberId id, nCount, nchannelId channel_id, nUserId user_id
          ,COALESCE(vMTitle, vCTitle, '') title, vEmail email, nRevokeRime revoke_time;
    --
  END IF;
  --
  SELECT 0 id;
  --
END