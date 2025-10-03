CREATE FUNCTION `OTE_migrateMention4Notification`() RETURNS INT(11)
BEGIN
    DECLARE no_more_rows    boolean;
    DECLARE nCount          INT DEFAULT 0;
    DECLARE nReturn         INT DEFAULT 0;
    DECLARE nUserId         BIGINT(20);
    DECLARE nHasMention     TINYINT(1);
    DECLARE nID             BIGINT(20);
    DECLARE nCommentID      BIGINT(20);
    DECLARE nActionTime     DOUBLE(13,3);
    DECLARE nUpdatedDate    DOUBLE(13,3);
    DECLARE noti_cursor CURSOR FOR
    # Start of: main script;
    SELECT cn.id, cn.user_id, cn.comment_id, cn.action_time, cn.updated_date
      FROM collection_notification cn
     WHERE ifnull(cn.comment_id, 0) > 0ha
       AND cn.action IN(6, 61)
       AND cn.has_mention = 0
      ;
    # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN noti_cursor;
   noti_loop: LOOP
     -- start LOOP noti_cursor
     FETCH noti_cursor INTO nID, nUserId, nCommentID , nActionTime, nUpdatedDate;
     -- stop LOOP WHEN no_more_rows
     IF (no_more_rows) THEN
       CLOSE noti_cursor;
       LEAVE noti_loop;
     END IF;
     # main UPDATE
     SET nReturn = n2024_considerMentionInNotification(nID, nCommentID, nActionTime, nUpdatedDate);
     SET nCount = nCount + 1;
      # main UPDATE
     --
   END LOOP noti_loop;
   --
RETURN nCount;
END