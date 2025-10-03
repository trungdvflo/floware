CREATE FUNCTION `n2024_considerMentionInNotification`(
 pnNotiID             BIGINT(20)
,pnCommentId          BIGINT(20)
,pnActionTime         DOUBLE(13,3)
,pnUpdatedDate        DOUBLE(13,3)
) RETURNS INT(11)
BEGIN
  --
  DECLARE no_more_rows    boolean;
  DECLARE nCount          INT DEFAULT 0;
  DECLARE nReturn         BIGINT(20) DEFAULT 0;
  DECLARE nUserID         BIGINT(20);
  DECLARE noti_cursor CURSOR FOR
  # Start of: main script;
  SELECT mu.user_id
    FROM comment_mention cm
    JOIN mention_user mu ON (cm.mention_user_id = mu.id)
   WHERE comment_id = pnCommentId;
  # END of: main script
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN noti_cursor;
  noti_loop: LOOP
    -- start LOOP noti_cursor
    FETCH noti_cursor INTO nUserID;
    -- stop LOOP WHEN no_more_rows
    IF (no_more_rows) THEN
      CLOSE noti_cursor;
      LEAVE noti_loop;
    END IF;
    # main UPDATE
    SET nReturn = n2023_createUserNotification(pnNotiID, 0, 1, pnActionTime, pnUpdatedDate, NULL, nUserID);
    --
    SET nCount = nCount + 1;
    # main UPDATE
  END LOOP noti_loop;
  --
  RETURN nCount;
  --
END