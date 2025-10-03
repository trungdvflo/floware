CREATE FUNCTION `futil_findNeedleInHaystack`(pvNeedle         TEXT
                                                               ,pvHaystack       TEXT
                                                               ,pnFindAll        TINYINT(1)) RETURNS TINYINT(1)
BEGIN
  --
  DECLARE vRegex        TEXT;
  DECLARE bReturn       BOOLEAN DEFAULT 1;
  DECLARE i             INT DEFAULT 1;
  DECLARE item          VARCHAR(255);
  DECLARE vNeedle       TEXT;
  DECLARE vHaystack     TEXT;
  --
  IF pvNeedle IS NULL OR pvHaystack IS NULL THEN
    --
    RETURN 0;
    --
  END IF;
  --
  SET vNeedle  = REPLACE(pvNeedle, ' ', '');
  SET vHaystack = REPLACE(pvHaystack, ' ', '');
  SET vHaystack = CONCAT('("', REPLACE(pvHaystack, ',', '","'), '")');
  --
  IF ifnull(pnFindAll, 0) = 0 THEN
    -- Escape special characters FOR USE IN the regex pattern
    SET vRegex = CONCAT('("', REPLACE(vNeedle, ',', '"|"'), '")');
    -- CHECK IF the regex pattern matches the TEXT string
    RETURN vHaystack REGEXP vRegex;
  ELSE
    --
    WHILE i <= LENGTH(vNeedle) - LENGTH(REPLACE(vNeedle, ',', '')) + 1 DO
      --
      SET item = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(vNeedle, ',', i), ',', -1));
      IF LOCATE(item, vHaystack) = 0 THEN
        RETURN 0;
      END IF;
      SET i = i + 1;
      --
    END WHILE;
    --
    RETURN bReturn;
    --
  END IF;
  --
END