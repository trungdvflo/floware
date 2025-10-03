CREATE FUNCTION `d2022_genDeletedItemForConferenceMember`(pnChannelID      BIGINT(11)
                                                                           ,pnMemberId       BIGINT(11)
                                                                           ,pnUserId         BIGINT(11)
                                                                           ,pnDeleteDate     DOUBLE(13,3)
                                                                           ) RETURNS INT(11)
BEGIN
  --
  DECLARE no_more_rows     boolean;
  DECLARE nItemId          BIGINT(20);
  DECLARE nUserId          BIGINT(20);
  DECLARE vUid            VARCHAR(255);
  DECLARE nReturn            INT;
  DECLARE link_cursor CURSOR FOR
  # Start of: main query
  SELECT cm.id, cc.uid, cm.user_id
    FROM conference_member cm
    JOIN conference_channel cc ON (cc.id = cm.channel_id)
   WHERE cc.id = pnChannelID
     AND cm.id <> pnMemberId
     AND cm.user_id <> pnUserId;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN link_cursor;
  link_loop: LOOP
    --
    FETCH link_cursor INTO nItemId, vUid, nUserId;
    --
    IF (no_more_rows) THEN
      CLOSE link_cursor;
      LEAVE link_loop;
    END IF;
    # main DELETE
    INSERT INTO deleted_item
          (item_id, item_type,          user_id,  item_uid, is_recovery, created_date, updated_date)
    value (pnMemberId, 'CONFERENCE_MEMBER', nUserId, '', 0, pnDeleteDate, pnDeleteDate);
    --
    SET nReturn = m2023_insertAPILastModify('conference_member', nUserId, pnDeleteDate);
    # main DELETE
  END LOOP link_loop;
  --
  RETURN 1;
  --
END