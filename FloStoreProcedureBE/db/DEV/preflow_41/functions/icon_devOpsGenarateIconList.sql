CREATE FUNCTION `icon_devOpsGenarateIconList`(vBaseLink   VARCHAR(255)
                                                                  ,pvDelimiter VARCHAR(5)
                                                                  ,vIconList   TEXT          
                                                                  ) RETURNS INT(11)
    READS SQL DATA
    DETERMINISTIC
BEGIN
  --
  DECLARE nCount    INTEGER;
  DECLARE vICON     VARCHAR(255);
  DECLARE vSHOR     VARCHAR(255);
  DECLARE vTYPE     TINYINT(1);
  DECLARE nDATE     DOUBLE(13,3);
  DECLARE nCursor   INTEGER DEFAULT 1;
  --
  IF INSTR(vIconList, pvDelimiter) = 0 THEN
    RETURN 0;
  END IF;
  -- icon count
  SET nCount = LENGTH(vIconList) - LENGTH(REPLACE(vIconList, pvDelimiter, '')) + 1;
  -- LOOP throw count
  simple_loop: LOOP
    --
    SET vICON = REPLACE(SUBSTRING(SUBSTRING_INDEX(vIconList, pvDelimiter, nCursor),
                       LENGTH(SUBSTRING_INDEX(vIconList, pvDelimiter, nCursor -1)) + 1), pvDelimiter, '');
    --
    SET vSHOR = REPLACE(SUBSTRING(SUBSTRING_INDEX(vICON, '.', 1),
                       LENGTH(SUBSTRING_INDEX(vICON, '.', 0)) + 1), '.', '');
    --
    SET vTYPE = CASE
                    WHEN instr(vSHOR, 'ic_sport_') THEN 0
                    WHEN instr(vSHOR, 'ic_travel_') THEN 1
                    WHEN instr(vSHOR, 'ic_symbols_') THEN 2
                END;
    --
    SET nDATE = UNIX_TIMESTAMP() + nCursor + floor(RAND() * 1000)/1000;
    -- prevent INSERT DUPLICATE
    INSERT INTO  collection_icon
            (shortcut, cdn_url, icon_type, description, created_date, updated_date)
    VALUES ( vSHOR, CONCAT(vBaseLink, vICON), vTYPE, vSHOR, nDATE, nDATE)
      ON DUPLICATE KEY UPDATE updated_date=VALUES(updated_date);
  --
  --
  IF nCursor = nCount THEN
    LEAVE simple_loop;
  END IF;
  SET nCursor = nCursor + 1;
  END LOOP simple_loop;
  
  -- UPDATE last modify collection_collection
  UPDATE api_last_modified alm
    SET alm.api_modified_date = nDATE
       ,alm.updated_date = nDATE
   WHERE alm.api_name = 'collection_icon'
    AND alm.id > 1;
  
   RETURN 1;
   --
END