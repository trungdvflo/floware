CREATE FUNCTION `c2023_sendLastModifyConference`(pvApiName             VARCHAR(255)
                                                              ,pnChannelId        BIGINT(20)
                                                              ,pnLastModifyDate      DOUBLE(13,3)) RETURNS INT(11)
BEGIN
  --
  DECLARE nUserId      BIGINT(20);
  DECLARE no_more_rows boolean;
  DECLARE nReturn      BIGINT(20)  DEFAULT 0;
  DECLARE vApiName     VARCHAR(255);
  DECLARE api_cursor CURSOR FOR 
  -- 1. GET ALL user id IN 1 collection BOTH owner AND member
   SELECT cm.user_id, pvApiName
    FROM conference_member cm
   WHERE cm.channel_id = pnChannelId;
  --
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN api_cursor;
  api_loop: LOOP
    --
    FETCH api_cursor INTO nUserId, vApiName;
    --
    IF (no_more_rows) THEN
      CLOSE api_cursor;
      LEAVE api_loop;
    END IF;
    
    # 2. main UPDATE
    SET nReturn = m2023_insertAPILastModify(vApiName, nUserId, pnLastModifyDate);
    --
  END LOOP api_loop;
  --
  RETURN nReturn;
  --
END