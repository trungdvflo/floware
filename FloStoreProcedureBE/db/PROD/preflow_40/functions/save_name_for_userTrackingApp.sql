CREATE FUNCTION `save_name_for_userTrackingApp`() RETURNS INT(11)
BEGIN
  --
  DECLARE nUTAID               BIGINT(20);
  DECLARE nUID                 BIGINT(20);
  DECLARE nTrackingAppId       BIGINT(20);
  DECLARE vUserName            VARCHAR(255);
  DECLARE nExistedTA           BIGINT(20);
  DECLARE dLastUsedExisted     BIGINT(20);
  DECLARE no_more_rows         boolean;
  DECLARE dLastUse             timestamp;
  
   DECLARE gu_cursor CURSOR FOR
  # Start of: main query
 SELECT uta.id, uta.tracking_app_id, ifnull(max(uta.last_used_date), unix_timestamp()) last_used_date
        ,uta.username, u.id user_id
    FROM user_tracking_app uta
    JOIN `user` u ON uta.user_id = u.id
    WHERE uta.username IS NULL
      GROUP BY uta.user_id, uta.tracking_app_id;
  # END of: main query
   
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN gu_cursor;
  uta_loop: LOOP
    --
    FETCH gu_cursor INTO nUTAID, nTrackingAppId, dLastUse, vUserName, nUID;
    --
    IF (no_more_rows) THEN
      CLOSE gu_cursor;
      LEAVE uta_loop;
    END IF;
    -- CHECK exist COLUMN already WITH username
    SELECT uta.id, uta.last_used_date
      INTO nExistedTA, dLastUsedExisted
    FROM user_tracking_app uta
   WHERE uta.tracking_app_id = nTrackingAppId
       AND uta.user_id = nUID
       AND uta.username IS NOT NULL
  ORDER BY uta.last_used_date DESC
       LIMIT 1;
    --
    # main UPDATE
    IF ifnull(nExistedTA, 0) = 0 THEN
      -- NOT existed
      UPDATE user_tracking_app uta
         SET uta.username = vUserName
       WHERE uta.id = nUTAID;
      --
    ELSEIF dLastUse > dLastUsedExisted THEN
      -- existed & last USE NOT UPDATE
      UPDATE user_tracking_app uta
         SET uta.last_used_date = dLastUse
       WHERE uta.id = nExistedTA;
      --
     END IF;
    # main UPDATE
  END LOOP uta_loop;
  --
RETURN 1;
END