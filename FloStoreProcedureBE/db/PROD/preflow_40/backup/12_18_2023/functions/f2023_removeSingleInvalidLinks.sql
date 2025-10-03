CREATE FUNCTION `f2023_removeSingleInvalidLinks`(pnID        BIGINT(20)
                                               ,pnLinkID    BIGINT(20)
                                               ,pvLinkType  VARCHAR(45)
                                               ,pnUserId    BIGINT(20)) RETURNS INT(11)
BEGIN
  --
  DECLARE vItemType         VARBINARY(50) DEFAULT NULL;
  DECLARE nReturn           INT(11) DEFAULT 0;
  DECLARE nCollectionID     BIGINT(20) DEFAULT 0;
  # Start of: main query
  IF ifnull(pnUserId, 0) = 0 THEN
    RETURN 0;
  END IF;
  
  # main DELETE
  CASE pvLinkType 
  WHEN 'CH' THEN
    --
    DELETE FROM contact_history
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'HISTORY';
    --
  WHEN 'RO' THEN
    --
    DELETE FROM recent_object
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'RECENT_OBJ';
    --
  WHEN 'KC' THEN
    --
    DELETE FROM kanban_card
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'CANVAS';
    --
  WHEN 'LCO' THEN
    --
    DELETE FROM linked_collection_object
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'COLLECTION_LINK';
    
    SELECT fil.collection_id
      INTO nCollectionID
      FROM flo_invalid_link fil
     WHERE fil.id = pnID;
    --
  WHEN 'LCOM' THEN
    --
    DELETE FROM linked_collection_object
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'COLLECTION_LINK_MEMBER';
    --
  WHEN 'LO' THEN
    --
    DELETE FROM linked_object
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'LINK';
    --
  WHEN 'TC' THEN
      --
    DELETE FROM trash_collection
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'TRASH';
    --
  WHEN 'ET' THEN
    --
    DELETE FROM email_tracking
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'TRACK';
    --
  WHEN 'ME' THEN
    --
    DELETE FROM metadata_email
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'METADATA_EMAIL';
    --
  WHEN 'SO' THEN
    --
    DELETE FROM sort_object
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'VTODO';
    --
  WHEN 'KB' THEN
    --
    DELETE FROM kanban_card
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'CANVAS';
    --
  WHEN 'CIM' THEN
    --
    DELETE FROM collection_instance_member
      WHERE id      = pnLinkID
        AND user_id = pnUserId;
    --
    SET vItemType = 'COLLECTION_INSTANCE_MEMBER';
    --
  ELSE
    --
    SET vItemType = NULL;
    --
  END CASE;
  -- deleted item + last modify
  IF vItemType IS NOT NULL THEN
    --
    SET nReturn = d2022_generateDeletedItemSharedOmni(vItemType, nCollectionID, pnLinkID, unix_timestamp(CURRENT_TIMESTAMP(3)), pnUserId);
    --
  END IF;
  -- final: remove FROM this TABLE too
  UPDATE flo_invalid_link fil
      SET fil.deleted_date = unix_timestamp(CURRENT_TIMESTAMP(3))
        ,fil.updated_date  = unix_timestamp(CURRENT_TIMESTAMP(3))
        ,fil.considering   = 0
        ,fil.is_processing = 0
    WHERE id      = pnID
      AND user_id = pnUserId;
  --
  # main DELETE
  --
  RETURN nReturn;
  --
END