CREATE FUNCTION `modify_insertAPILastModify`(pvAPIName      VARCHAR(255)
                                                               ,pnUserId       BIGINT(20)
                                                               ,pdModifyDate   DOUBLE(13,3)) RETURNS BIGINT(20)
BEGIN
  -- DEPRECATED
  DECLARE nReturn         BIGINT(20) DEFAULT 0;
  DECLARE nModifiedDate   DOUBLE(13,3) DEFAULT 0;
  DECLARE nId             BIGINT(20) DEFAULT 0;
  --
  SELECT alm.id, ifnull(max(alm.api_modified_date), 0)
    INTO nId, nModifiedDate
    FROM api_last_modified alm
    WHERE alm.user_id = pnUserId
      AND alm.api_name = pvAPIName;

  IF nModifiedDate >= pdModifyDate THEN
    --
    RETURN nId;
    --
  END IF;
  -- INSERT last modify
  INSERT INTO api_last_modified
         (`user_id`, `api_name`, `api_modified_date`, `created_date`, `updated_date`)
  VALUES(pnUserId, pvAPIName, pdModifyDate, pdModifyDate, pdModifyDate)
  ON DUPLICATE KEY UPDATE api_modified_date=VALUES(api_modified_date), updated_date=VALUES(updated_date);
  -- keep id TO RETURN
  SELECT last_insert_id() INTO nReturn;
  -- INSERT IGNORE TO prevent DUPLICATE item
  INSERT IGNORE INTO push_change 
      (user_id, created_date) 
  VALUES (pnUserId, pdModifyDate);
  --
  RETURN nReturn;
  --
END