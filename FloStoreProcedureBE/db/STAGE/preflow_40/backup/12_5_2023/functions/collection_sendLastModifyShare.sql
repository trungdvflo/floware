CREATE FUNCTION `collection_sendLastModifyShare`(vApiName             VARCHAR(255)
                                                                   ,nCollectionId        BIGINT(20)
                                                                   ,nLastModifyDate      DOUBLE(13,3)) RETURNS INT(11)
BEGIN
  -- DEPRECATED
  DECLARE nUserId      BIGINT(20);
  DECLARE no_more_rows boolean;
  DECLARE nReturn      BIGINT(20)  DEFAULT 0;
  DECLARE api_cursor CURSOR FOR 
  -- 1. GET ALL user id IN 1 collection BOTH owner AND member
  SELECT co.user_id
    FROM collection co
   WHERE co.id = nCollectionId
  UNION
  SELECT csm.member_user_id user_id
    FROM collection_shared_member csm
   WHERE csm.collection_id = nCollectionId;
  --
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN api_cursor;
  api_loop: LOOP
    --
    FETCH api_cursor INTO nUserId;
    --
    IF (no_more_rows) THEN
      CLOSE api_cursor;
      LEAVE api_loop;
    END IF;
    # 2. main UPDATE
    SET nReturn = m2023_insertAPILastModify(vApiName, nUserId, nLastModifyDate);
    --
    -- IF we send api name comment OR something ELSE ...
    -- ... we also need TO send FOR the collection activity too
    IF vApiName = 'collection_comment'
       OR vApiName = 'collection_history'
       THEN 
      # main UPDATE
      SET nReturn = m2023_insertAPILastModify('collection_activity', nUserId, nLastModifyDate);
      --
    END IF;
    --
  END LOOP api_loop;
  --
  RETURN nReturn;
  --
END