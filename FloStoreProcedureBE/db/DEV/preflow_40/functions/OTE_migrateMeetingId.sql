CREATE FUNCTION `OTE_migrateMeetingId`() RETURNS INT(11)
BEGIN
    DECLARE no_more_rows    boolean;
    DECLARE nCount          INT DEFAULT 0;
    DECLARE nReturn         INT DEFAULT 0;
    DECLARE nUserId         BIGINT(20);
    DECLARE nChannelId         BIGINT(20);
    DECLARE nID             BIGINT(20);
    DECLARE vUID            VARCHAR(255);
    DECLARE nMeetingId      BIGINT(20);
    DECLARE vMeetingId     VARCHAR(1000);
    DECLARE vExMeetingId   VARCHAR(1000);
    DECLARE channel_cursor CURSOR FOR
    # Start of: main script;
     SELECT ch.id, ch.meeting_id, ch.external_meeting_id, cm.user_id, cm.channel_id
      FROM conference_history ch
      JOIN conference_member cm ON (ch.member_id = cm.id)
      WHERE ifnull(ch.meeting_id,'') <> ''
        AND ch.conference_meeting_id = 0
       -- LIMIT 10000
      ;
    # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN channel_cursor;
   channel_loop: LOOP
     -- start LOOP channel_cursor
     FETCH channel_cursor 
      INTO nID, vMeetingId, vExMeetingId, nUserId, nChannelId;
     -- stop LOOP WHEN no_more_rows
     IF (no_more_rows) THEN
       CLOSE channel_cursor;
       LEAVE channel_loop;
     END IF;
     # main UPDATE
     --
     SELECT ifnull(max(cm.id), 0)
       INTO nMeetingId 
       FROM conference_meeting cm
      WHERE cm.meeting_id = vMeetingId
        AND cm.channel_id = nChannelId;
     --
     IF nMeetingId = 0 THEN
       --
       INSERT INTO conference_meeting
         (channel_id, user_id, meeting_id, external_meeting_id, created_date, updated_date)
       VALUES
         (nChannelId, nUserId, ifnull(vMeetingId, ''), ifnull(vExMeetingId, ''), unix_timestamp(now(3)), unix_timestamp(now(3)));
       --
       SET nMeetingId = last_insert_id();
     END IF;    
     --
     UPDATE conference_history ch
        SET ch.conference_meeting_id = nMeetingId
      WHERE ch.id = nID;
     --
     SET nCount = nCount + 1;
      # main UPDATE
     --
   END LOOP channel_loop;
   --
RETURN nCount;
END