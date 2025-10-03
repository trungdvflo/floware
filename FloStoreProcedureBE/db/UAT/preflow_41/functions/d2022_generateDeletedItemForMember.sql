CREATE FUNCTION `d2022_generateDeletedItemForMember`(pvItemType       VARCHAR(255)
                                                                            ,pnCollectionId   BIGINT(11)
                                                                            ,pnItemId         BIGINT(11)
                                                                            ,pnDeleteDate     DOUBLE(13,3)
                                                                            ) RETURNS INT(11)
BEGIN
  --
  DECLARE no_more_rows     boolean;
  DECLARE nUserId          BIGINT(20);
       
  DECLARE link_cursor CURSOR FOR
  # Start of: main query
 SELECT csm.member_user_id user_id
   FROM collection_shared_member csm
   JOIN collection co ON (csm.collection_id = co.id)
   WHERE co.id = pnCollectionId
     AND co.type = 3
     AND csm.shared_status IN (1,3); -- active + remove BY owner
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN link_cursor;
  link_loop: LOOP
    --
    FETCH link_cursor INTO nUserId;
    --
    IF (no_more_rows) THEN
      CLOSE link_cursor;
      LEAVE link_loop;
    END IF;
    # main DELETE
    INSERT INTO deleted_item
          (item_id, item_type, user_id,  item_uid, is_recovery, created_date, updated_date)
    value (pnItemId, 
          CASE pvItemType WHEN 'COLLECTION_LINK' THEN 'COLLECTION_LINK_MEMBER' ELSE pvItemType END
          ,nUserId, '', 0, pnDeleteDate, pnDeleteDate);
    # main DELETE
  END LOOP link_loop;
  --
  RETURN 1;
  --
END