CREATE FUNCTION `d2022_generateDeletedItemForShared`(pvItemType       VARCHAR(255)
                                                                            ,pnCollectionId   BIGINT(11)
                                                                            ,pnItemId         BIGINT(11)
                                                                            ,pnDeleteDate     DOUBLE(13,3)
                                                                            ) RETURNS INT(11)
BEGIN
  --
  DECLARE nUserId          BIGINT(20) DEFAULT 0;
  DECLARE nReturn          BIGINT(20) DEFAULT 0;
  # Start of: main query
  SELECT co.user_id
        INTO nUserId
        FROM collection co
       WHERE co.id = pnCollectionId;
  # END of: main query
  SET nReturn = d2022_generateDeletedItemSharedOmni(pvItemType
                                                        ,pnCollectionId
                                                        ,pnItemId
                                                        ,pnDeleteDate
                                                        ,nUserId);
  RETURN nReturn;
  --
END