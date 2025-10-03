CREATE FUNCTION `c2023_createConferenceHistorySendInviteV2`(pnChannelId  BIGINT(20)
                                                                            ,pnUserId     BIGINT(20)
                                                                            ,pnType       TINYINT(1)
                                                                            ,pvOrganizer  VARCHAR(100)
                                                                            ,pvInvitees   TEXT
                                                                            ,pvMeetingId  VARCHAR(1000)
                                                                            ,pvExMeetingId  VARCHAR(1000)) RETURNS INT(11)
BEGIN
  --
  DECLARE nReturn INT DEFAULT 0;
  DECLARE nID     BIGINT (20);
  # Start of: main query
  INSERT INTO conference_history
        (user_id, member_id, invitee, start_time, type, status, organizer, 
         action_time, meeting_id, external_meeting_id, created_date, updated_date) 
  SELECT u.id, cm.id, u.username, unix_timestamp(now(3)), pnType, 24, pvOrganizer
        ,unix_timestamp(now(3)), ifnull(pvMeetingId, ''), ifnull(pvExMeetingId, ''), unix_timestamp(now(3)), unix_timestamp(now(3))
    FROM conference_channel cc
    JOIN conference_member cm ON (cc.id = cm. channel_id)
    JOIN user u ON (u. id = cm. user_id)
   WHERE cc.id = pnChannelId
  AND cm.user_id <> pnUserId 
  AND find_in_set (u.username, pvInvitees);
  # END of: main query
  SELECT ROW_COUNT() INTO nReturn;
  --
  RETURN nReturn;
  --
END