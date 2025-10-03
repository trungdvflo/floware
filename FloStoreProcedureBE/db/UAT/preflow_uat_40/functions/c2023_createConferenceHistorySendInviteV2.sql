CREATE FUNCTION `c2023_createConferenceHistorySendInviteV2`(pnChannelId  BIGINT(20)
                                                                            ,pnUserId     BIGINT(20)
                                                                            ,pnType       TINYINT(1)
                                                                            ,pvOrganizer  VARCHAR(100)
                                                                            ,pvInvitees   TEXT
                                                                            ,pvMeetingId  VARCHAR(1000)
                                                                            ,pvExMeetingId  VARCHAR(1000)) RETURNS INT(11)
BEGIN
  --
  --
  DECLARE no_more_rows    boolean;
  DECLARE nCount          INT DEFAULT 0;
  DECLARE nReturn         BIGINT(20) DEFAULT 0;
  DECLARE nUserID         BIGINT(20);
  DECLARE vUserName       VARCHAR(100);
  DECLARE nCMID           BIGINT (20);
  DECLARE nMeetingId      BIGINT(20);

  DECLARE his_cursor CURSOR FOR
  # Start of: main script;
  SELECT u.id, cm.id, u.username
    FROM conference_channel cc
    JOIN conference_member cm ON (cc.id = cm. channel_id)
    JOIN user u ON (u. id = cm. user_id)
   WHERE cc.id = pnChannelId
  AND cm.user_id <> pnUserId 
  AND find_in_set (u.username, pvInvitees);
  # END of: main script
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN his_cursor;
  his_loop: LOOP
    -- start LOOP his_cursor
    FETCH his_cursor INTO nUserID, nCMID, vUserName;
    -- stop LOOP WHEN no_more_rows
    IF (no_more_rows) THEN
      CLOSE his_cursor;
      LEAVE his_loop;
    END IF;

    IF ifnull(pvMeetingId, '') != '' THEN
      --
      SELECT ifnull(max(cm.id), 0)
        INTO nMeetingId 
        FROM conference_meeting cm
       WHERE cm.meeting_id = pvMeetingId
         AND cm.channel_id = pnChannelId;
      --
      IF nMeetingId = 0 THEN
        --
        INSERT INTO conference_meeting
          (channel_id, user_id, meeting_id, external_meeting_id, created_date, updated_date)
        VALUES
          (pnChannelId, pnUserId, ifnull(pvMeetingId, ''), ifnull(pvExMeetingId, ''), unix_timestamp(now(3)), unix_timestamp(now(3)));
        --
        SET nMeetingId = last_insert_id();
      END IF;
      --
    END IF;

    # main UPDATE
    INSERT INTO conference_history
        (user_id, member_id, invitee, start_time, type, status, organizer, 
         action_time, conference_meeting_id, meeting_id, external_meeting_id, created_date, updated_date) 
    VALUES
        (nUserID, nCMID, vUserName, unix_timestamp(now(3)), pnType, 24, pvOrganizer
        ,unix_timestamp(now(3)), nMeetingId, ifnull(pvMeetingId, ''), ifnull(pvExMeetingId, ''), unix_timestamp(now(3)), unix_timestamp(now(3)));
    --
    SET nReturn = m2023_insertAPILastModify('conference_history', nUserID, unix_timestamp(now(3)));
    --
    SET nCount = nCount + 1;
    # main UPDATE
  END LOOP his_loop;
  --
  RETURN nCount;
  --
END