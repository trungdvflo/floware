CREATE FUNCTION `f2023_cleanInvalidLinks4User`(pnID BIGINT(20)
                                                                 ,pvObjectUid   VARBINARY(1000)
                                                                 ,pvObjectType  VARBINARY(50)
                                                                 ,pnUserID  BIGINT(20)) RETURNS INT(11)
BEGIN
  --
  DECLARE nID          BIGINT(20);
  DECLARE nLinkID      BIGINT(20);
  DECLARE vLinkType    VARCHAR(45);
  DECLARE vItemType    VARBINARY(50) DEFAULT NULL;
  DECLARE nCount       INT(11) DEFAULT 0;
  DECLARE nReturn      INT(11) DEFAULT 0;
  DECLARE nUserId      BIGINT(20);
  DECLARE no_more_rows boolean;
  DECLARE link_cursor CURSOR FOR
  # Start of: main query
  SELECT fil.id, fil.link_id, fil.link_type, fil.user_id
    FROM flo_invalid_link fil
   WHERE fil.user_id = pnUserID
     AND (ifnull(pnID, 0) = 0 OR fil.id = pnID)
     AND (pvObjectUid  IS NULL OR fil.object_uid  = pvObjectUid)
     AND (pvObjectType IS NULL OR fil.object_type = pvObjectType)
     AND fil.deleted_date IS NULL
     AND fil.considering = 0;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  IF ifnull(pnUserID, 0) = 0 THEN
    RETURN 0;
  END IF;
  OPEN link_cursor;
  link_loop: LOOP
    --
    FETCH link_cursor 
     INTO nID, nLinkID, vLinkType, nUserId;
    --
    IF (no_more_rows) THEN
      CLOSE link_cursor;
      LEAVE link_loop;
    END IF;
    # main DELETE
    SET nReturn = f2023_removeSingleInvalidLinks(nID, nLinkID, vLinkType, nUserId);
    --
    SET nCount = nCount + 1;
    # main DELETE
  END LOOP link_loop;
  --
  RETURN ifnull(nCount, 0);
  --
END