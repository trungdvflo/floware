CREATE PROCEDURE `adm2022_protectPage`(generateNew      TINYINT(1)
                                                           ,verifyCode       TEXT
                                                           ,`checksum`       VARCHAR(128)
                                                           ,timeCodeExpire   INT(11)
                                                           ,createdDate      DOUBLE(13,3)
                                                           ,updatedDate      DOUBLE(13,3)
                                                           ,nOffset          INT(11)
                                                           ,nLimit           INT(11))
BEGIN
  --
  DECLARE nID  BIGINT(20);
  --
  IF ifnull(generateNew, 0) = 1 THEN
    -- CHECK existed
    SELECT pp.id
      INTO nID
      FROM protect_page pp
    -- WHERE ??
     LIMIT 1;
    -- 
    IF ifnull(nID, 0) = 0 THEN
      --
      INSERT INTO protect_page
             (verify_code, `checksum`, time_code_expire, created_date, updated_date)
      VALUES (verifyCode,  `checksum`,  timeCodeExpire,  createdDate, updatedDate);
      --
    ELSE
      --
      UPDATE protect_page pp
         SET pp.verify_code      = verifyCode
            ,pp.`checksum`       = `checksum`
            ,pp.time_code_expire = timeCodeExpire
            ,pp.updated_date     = updatedDate
      WHERE pp.id = nID;
      --
    END IF;
    --
  END IF;
  --
  SELECT pp.verify_code, pp.time_code_expire, pp.created_date, pp.updated_date
        ,(SELECT count(*) FROM protect_page) total
    FROM protect_page pp
    LIMIT nOffset, nLimit;
  --
END