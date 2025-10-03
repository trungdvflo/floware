CREATE FUNCTION `d2022_generateDeletedItemSharedOmni`(pvItemType      VARCHAR(255)
                                                                            ,pnCollectionId   BIGINT(20)
                                                                            ,pnItemId         BIGINT(20) -- item_id: depend ON item type
                                                                            ,pnDeleteDate     DOUBLE(13,3)
                                                                            ,pnUserId         BIGINT(20) -- owner
                                                                       ) RETURNS INT(11)
BEGIN
  --
  DECLARE nReturn          BIGINT(20)   DEFAULT 0;
  DECLARE dDeletedDate     DOUBLE(13,3) DEFAULT ifnull(pnDeleteDate, unix_timestamp(now(3)));
  DECLARE bAlmComment      TINYINT(1)   DEFAULT IF(ifnull(pvItemType, 'NA') = 'COLLECTION_COMMENT' OR ifnull(pvItemType, 'NA') = 'COMMENT_ATTACHMENT', 1, 0);
 
  # main DELETE
  INSERT INTO deleted_item
        (item_id,   item_type, user_id, item_uid, is_recovery, created_date, updated_date)
  value (pnItemId, pvItemType, pnUserId,      '',           0,  dDeletedDate, dDeletedDate);
  --
  IF bAlmComment THEN
     --
     SET nReturn = m2023_insertAPILastModify('collection_comment', pnUserId, dDeletedDate);
     --
  ELSEIF ifnull(pvItemType, 'NA') <> 'NA' THEN
    --
    SET nReturn = m2023_insertAPILastModify(lower(pvItemType), pnUserId, dDeletedDate);
    --
  END IF;
  SELECT last_insert_id() INTO nReturn;
  # main DELETE
  -- CALL FOR MEMBER
  IF ifnull(pnCollectionId, 0) > 0 THEN
    --
    SET nReturn = d2022_generateDeletedItemForMember(pvItemType, pnCollectionId, pnItemId, dDeletedDate);
    --
    IF bAlmComment THEN
      --
      SET nReturn = c2022_sendLastModifyShare('collection_comment', pnCollectionId, dDeletedDate);
      --
    ELSEIF ifnull(pvItemType, 'NA') <> 'NA' THEN
      --
      SET nReturn = c2022_sendLastModifyShare(lower(pvItemType), pnCollectionId, dDeletedDate);
      --
    END IF;
    --
  END IF;
  --
  RETURN nReturn;
  --
END