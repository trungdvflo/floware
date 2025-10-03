CREATE FUNCTION `c2023_removeAllMention`(pnCommentId      INT(11)
                                                           ,pnUserId         BIGINT(20)
                                                           ) RETURNS INT(11)
BEGIN
  --
  DECLARE nID              BIGINT(20);
  DECLARE no_more_rows     boolean;
  DECLARE nCount           INT(11) DEFAULT 0;
  DECLARE nReturn          INT(11);
  DECLARE mention_cursor CURSOR FOR
  # Start of: main query
  SELECT cm.id
      FROM collection_comment cc 
      JOIN comment_mention cm ON (cc.id = cm.comment_id)
     WHERE cc.id = pnCommentId
       AND cc.user_id  = pnUserId;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN mention_cursor;
  mention_loop: LOOP
    --
    FETCH mention_cursor 
     INTO nID;
    --
    IF (no_more_rows) THEN
      CLOSE mention_cursor;
      LEAVE mention_loop;
    END IF;
    # main DELETE
    DELETE FROM comment_mention
     WHERE id  = nID;
     # main DELETE
     SET nCount = nCount + 1;
  END LOOP mention_loop;
  --
  RETURN nCount;
  --
END