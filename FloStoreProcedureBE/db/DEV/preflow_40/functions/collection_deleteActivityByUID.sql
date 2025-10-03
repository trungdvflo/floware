CREATE FUNCTION `collection_deleteActivityByUID`(pvUid            VARBINARY(1000)
                                                                   ,pnDeleteDate     DOUBLE(13,3)
                                                                   ) RETURNS INT(11)
BEGIN
  --
  DECLARE nID              BIGINT(20);
  DECLARE vTable           VARCHAR(255);
  DECLARE no_more_rows     boolean;
  DECLARE nCount           INT(11) DEFAULT 0;
  DECLARE nCollectionId    BIGINT(20);
  DECLARE nUserId          BIGINT(20);
  DECLARE nReturn          INT(11);
  DECLARE link_cursor CURSOR FOR
  # Start of: main query
  SELECT 'comment' tblName, cc.id, ca.collection_id, ca.user_id
    FROM collection_activity ca
    JOIN collection_comment cc ON (ca.id = cc.collection_activity_id)
   WHERE ca.object_uid = pvUid
   UNION
  SELECT 'history' tblName, ch.id, ca.collection_id, ca.user_id
    FROM collection_activity ca
    JOIN collection_history ch ON (ca.id = ch.collection_activity_id)
   WHERE ca.object_uid = pvUid
   UNION
  SELECT 'activity', ca.id, ca.collection_id, ca.user_id
    FROM collection_activity ca
   WHERE ca.object_uid = pvUid;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN link_cursor;
  link_loop: LOOP
    --
    FETCH link_cursor 
     INTO vTable, nID, nCollectionId, nUserId;
    --
    IF (no_more_rows) THEN
      CLOSE link_cursor;
      LEAVE link_loop;
    END IF;
    # main DELETE
    IF vTable = 'activity' THEN
      --
       DELETE FROM collection_activity
        WHERE id  = nID;
      --
      SET nReturn = collection_generateDeletedItemSharedOmni('COLLECTION_ACTIVITY', nCollectionId, nID, pnDeleteDate, nUserId);
      --
    ELSEIF vTable = 'comment' THEN
      --
      DELETE FROM collection_comment
       WHERE id  = nID;
      --
      SET nReturn = collection_generateDeletedItemSharedOmni('COLLECTION_COMMENT', nCollectionId, nID, pnDeleteDate, nUserId);
      --
    ELSEIF vTable = 'history' THEN
      --
      DELETE FROM collection_history
       WHERE id  = nID;
      --
      SET nReturn = collection_generateDeletedItemSharedOmni('COLLECTION_HISTORY', nCollectionId, nID, pnDeleteDate, nUserId);
      --
    END IF;
    SET nCount = nCount + 1;
    # main DELETE
  END LOOP link_loop;
  --
  RETURN nCount;
  --
END