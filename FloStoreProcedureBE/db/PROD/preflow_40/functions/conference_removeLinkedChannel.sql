CREATE FUNCTION `conference_removeLinkedChannel`(uid         VARBINARY(1000)
                                                                   ,nUserId      BIGINT(20)
                                                                   ,dDeleteTime  DOUBLE(13,3)) RETURNS INT(11)
BEGIN
  -- DEPRECATED
  DECLARE nID              BIGINT(20);
  DECLARE nReturn          BIGINT(20);
  DECLARE vType            VARCHAR(3);
  DECLARE no_more_rows     boolean;
  DECLARE link_cursor CURSOR FOR
  -- A. UPDATE TO USE lasted tracking app id
  # Start of: main query
 -- 1. remove `linked_collection_object` 
 SELECT DISTINCT(lco.id), 'COL' ltype
   FROM linked_collection_object lco
  WHERE lco.user_id = nUserId
    AND lco.object_uid = uid
  UNION
  -- 2. remove `linked_object`
 SELECT DISTINCT(lo.id), 'OBJ' ltype
   FROM linked_object lo
  WHERE lo.user_id = nUserId
    AND (lo.source_object_uid = uid
        OR lo.destination_object_uid = uid)
    -- 3. `kanban_card`
  UNION
 SELECT DISTINCT(kc.id), 'KAN' ltype
   FROM kanban_card kc
  WHERE kc.user_id = nUserId
    AND kc.object_uid = uid
-- 4. `conference_history`
  UNION
 SELECT DISTINCT(ch.id), 'HIS' ltype
   FROM conference_history ch
   JOIN conference_member cm ON (ch.member_id = cm.id)
  WHERE ch.user_id = nUserId
    AND cm.uid = uid;
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
    # main DELETE
    IF vType = 'COL' THEN 
      -- 1. remove `linked_collection_object`
      -- -- 1.1 INSERT deleted_item
      INSERT INTO deleted_item
          (item_id, item_type, user_id,  item_uid, is_recovery, created_date, updated_date)
      value (nID, 'COLLECTION_LINK', nUserId,      '',           0,  dDeleteTime, dDeleteTime);
      -- -- 1.2 UPDATE last modify linked_collection_object
      SET nReturn = modify_insertAPILastModify('linked_collection_object', nUserId, dDeleteTime);
      -- -- 1.3 DELETE linked_collection_object
      DELETE FROM linked_collection_object
      WHERE user_id = nUserId
      AND id  = nID;
      --
    ELSEIF vType = 'OBJ' THEN
      -- 2. remove `linked_object`
      -- -- 1.1 INSERT deleted_item
      INSERT INTO deleted_item
        (item_id, item_type, user_id,  item_uid, is_recovery, created_date, updated_date)
      value (nID, 'LINK', nUserId,      '',           0,  dDeleteTime, dDeleteTime);
      -- -- 1.2 UPDATE last modify linked_object
      SET nReturn = modify_insertAPILastModify('linked_object', nUserId, dDeleteTime);
      -- -- 1.3 DELETE linked_object
      DELETE FROM linked_object
      WHERE user_id = nUserId
      AND id  = nID;
      --
    ELSEIF vType = 'KAN' THEN
      -- 3. `kanban_card`
      DELETE FROM kanban_card
      WHERE user_id = nUserId
      AND id  = nID;
      --
    ELSEIF vType = 'HIS' THEN
      -- 4. `conference_history`
      DELETE FROM conference_history
      WHERE user_id = nUserId
      AND id  = nID;
      --
    END IF;
    # main DELETE
  END LOOP link_loop;
  --
  RETURN 1;
  --
END