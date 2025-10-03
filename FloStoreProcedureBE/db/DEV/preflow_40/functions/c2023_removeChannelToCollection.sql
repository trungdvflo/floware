CREATE FUNCTION `c2023_removeChannelToCollection`(
pnColId    BIGINT(20)
,pvUID      VARCHAR(255)
,pnUserId   BIGINT(20)
,pvEmail    VARCHAR(100)) RETURNS INT(11)
BEGIN
  DECLARE nID              BIGINT(20);
  DECLARE nCount           INT DEFAULT 0;
  DECLARE nReturn          INT DEFAULT 0;
  DECLARE dDeleteTime      DOUBLE(13,3) DEFAULT unix_timestamp(now(3));
  DECLARE vType            VARCHAR(3);
  DECLARE no_more_rows     boolean;
  DECLARE link_cursor CURSOR FOR
  # Start of: main query
 SELECT DISTINCT(lco.id), 'COL' ltype
       FROM linked_collection_object lco
  LEFT JOIN conference_channel cc ON (lco.object_uid = cc.uid)
       JOIN conference_member cm ON (cm.channel_id = cc.id)
  WHERE lco.user_id = pnUserId
    AND cc.uid = pvUID
    AND cm.user_id = pnUserId
    AND lco.collection_id <> pnColId;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN link_cursor;
  link_loop: LOOP
    --
    FETCH link_cursor INTO nID, vType;
    --
    IF (no_more_rows) THEN
      CLOSE link_cursor;
      LEAVE link_loop;
    END IF;
    SET dDeleteTime = dDeleteTime + nCount / 1000;
    # main DELETE
    INSERT INTO deleted_item
          (item_id, item_type, user_id,  item_uid, is_recovery, created_date, updated_date)
     value (nID, 'COLLECTION_LINK', pnUserId,      '',           0,  dDeleteTime, dDeleteTime);
     --
     SET nReturn = m2023_insertAPILastModify('linked_collection_object', pnUserId, dDeleteTime);
     --
     DELETE FROM linked_collection_object
      WHERE user_id = pnUserId
        AND id  = nID;
    --
    SET nCount = nCount + 1;
    # main DELETE
  END LOOP link_loop;
  --
  RETURN nCount;
END