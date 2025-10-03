CREATE FUNCTION `f2023_checkIsSharingObjectToMe`(pnID INT(11)) RETURNS INT(11)
BEGIN
  -- -1: ERROR 
  -- 0: NOT Share
  -- 1: Sharing
  DECLARE nReturn TINYINT(1);
  --
  IF isnull(pnID) THEN
    RETURN -1;
  END IF;
  --
  SELECT ifnull(max(lco.id), 0) > 0
    INTO nReturn
    FROM flo_invalid_link fil
    JOIN linked_collection_object lco ON (fil.object_type = lco.object_type AND fil.object_uid = lco.object_uid AND lco.user_id <> fil.user_id)
    JOIN collection_shared_member csm ON (lco.collection_id = csm.collection_id AND csm.member_user_id = fil.user_id)
   WHERE fil.id = pnID
     AND csm.shared_status = 1;

  RETURN nReturn;
  --
RETURN 1;
END