CREATE FUNCTION `f2023_removeShareMemberOutdated`(pnUserId BIGINT(20)) RETURNS INT(11)
BEGIN
  --
  DECLARE nID              BIGINT(20);
  DECLARE nUserId          BIGINT(20);
  DECLARE no_more_rows     boolean;
  DECLARE nCount           INT(11) DEFAULT 0;
  DECLARE link_cursor CURSOR FOR
  # Start of: main query
  SELECT csm.id, csm.user_id
    FROM collection_shared_member csm
   WHERE csm.member_user_id = pnUserId
     AND csm.shared_status = 3 -- REMOVED
     AND csm.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL 12 hour));
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN link_cursor;
  link_loop: LOOP
    --
    FETCH link_cursor 
     INTO nID, nUserId;
    --
    IF (no_more_rows) THEN
      CLOSE link_cursor;
      LEAVE link_loop;
    END IF;
    # main DELETE
    DELETE
      FROM collection_shared_member
     WHERE member_user_id = pnUserId
       AND id = nID;
    # main DELETE
    SET nCount = nCount + 1;
  END LOOP link_loop;
  --
  RETURN nCount;
  --
END