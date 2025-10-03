CREATE FUNCTION `collection_createCollectionActivity`(nCollectionId         BIGINT(20)
                                                               ,objectUid            VARBINARY(1000)
                                                               ,objectType           VARBINARY(50)
                                                               ,createdDate          DOUBLE(13,3)
                                                               ,updatedDate          DOUBLE(13,3)) RETURNS BIGINT(20)
BEGIN
  --
  -- CREATE collection activity BY collectionId
  --
  DECLARE nCAID  BIGINT(20);
  DECLARE nUserId            BIGINT(20);
  DECLARE vCalendarUri       VARCHAR(255);
  DECLARE vOwnerEmail         VARCHAR(255);
  DECLARE vObjectHref         TEXT DEFAULT '';
  --
  --
  SELECT ifnull(max(ca.id), 0)
    INTO nCAID
    FROM collection_activity ca
   WHERE ca.collection_id = nCollectionId
     AND ca.object_uid = objectUid;
  --
  IF ifnull(nCAID, 0) > 0 THEN
    --
    RETURN nCAID;
    --
  ELSE
    --
    SELECT u.email, co.calendar_uri, co.user_id
    INTO vOwnerEmail, vCalendarUri, nUserId
    FROM  collection co
    JOIN user u ON (u.id = co.user_id)
   WHERE co.id = nCollectionId;
    --
    IF ifnull(objectType, '') <> 'URL' THEN
      --
      SET vObjectHref = concat("/calendarserver.php/calendars/", vOwnerEmail, "/", vCalendarUri, "/", objectUid, ".ics");
      --
    END IF;
    --
    INSERT INTO `collection_activity`
    (`collection_id`, user_id, `object_uid`, `object_type`, object_href,  `created_date`, `updated_date`)
    VALUES
    (nCollectionId, nUserId, objectUid, objectType, vObjectHref, createdDate, updatedDate);
    SELECT last_insert_id()
      INTO nCAID;
    --
  END IF;
  --
  RETURN nCAID;
  --
END