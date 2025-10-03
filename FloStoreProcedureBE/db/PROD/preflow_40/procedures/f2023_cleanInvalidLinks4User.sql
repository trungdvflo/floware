CREATE PROCEDURE `f2023_cleanInvalidLinks4User`(pnID BIGINT(20)
                                                                 ,pvObjectUid   VARBINARY(1000)
                                                                 ,pvObjectType  VARBINARY(50)
                                                                 ,pnUserID  BIGINT(20))
BEGIN
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
END