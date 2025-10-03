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
  SET nReturn = m2023_insertAPILastModify(pvAPIName, pnUserId, pdModifyDate);
  --
  RETURN nReturn;
  --
END