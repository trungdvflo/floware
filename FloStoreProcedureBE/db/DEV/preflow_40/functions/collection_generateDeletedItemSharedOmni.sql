CREATE FUNCTION `collection_generateDeletedItemSharedOmni`(pvItemType      VARCHAR(255)
                                                                            ,pnCollectionId   BIGINT(20)
                                                                            ,pnItemId         BIGINT(20) -- item_id: depend ON item type
                                                                            ,pnDeleteDate     DOUBLE(13,3)
                                                                            ,pnUserId         BIGINT(20) -- owner
                                                                       ) RETURNS INT(11)
BEGIN
  -- DEPRECATED
  DECLARE nReturn          BIGINT(20) DEFAULT 0;
  # main DELETE
  SET nReturn = d2022_generateDeletedItemSharedOmni(pvItemType, pnCollectionId, pnItemId, pnDeleteDate, pnUserId);
  --
  RETURN nReturn;
  --
END