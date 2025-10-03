CREATE PROCEDURE `oauth_signupFloAccount`(vUsername       VARCHAR(255)
                                        ,vDigestA1       VARCHAR(255)
                                        ,nDomainId       BIGINT(20)
                                        ,vEmail          VARCHAR(255)
                                        ,vPwd            VARCHAR(255)
                                        ,vPrefix         VARCHAR(255)
                                        ,nSaltLength     INTEGER
                                        ,dCreatedDate    timestamp
                                        ,dUupdatedDate   timestamp
                                        ,vAppreg_id      VARCHAR(255)
                                        ,vFullname       VARCHAR(255)
                                        ,vRSA            TEXT
                                        ,vToken          VARCHAR(500)
                                        ,nTokenExpire    DOUBLE(13,3)
                                        ,vBirthday       VARCHAR(255)
                                        ,v2ndEmail       VARCHAR(255)
                                        ,vDescription    VARCHAR(255)
                                        )
BEGIN
  --
  DECLARE nUserID BIGINT(20) DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION  ROLLBACK;
  START TRANSACTION;
  -- 1. CREATE user
  INSERT INTO user(`username`, digesta1, domain_id, email, `password`
                  ,created_date, updated_date, appreg_id, fullname, rsa, token
                  ,token_expire, birthday, secondary_email, description)
  VALUES (vUsername, vDigestA1, nDomainId, vEmail, ENCRYPT(vPwd, CONCAT(vPrefix, SUBSTRING(SHA(RAND()), nSaltLength)))
         ,dCreatedDate, dUupdatedDate,vAppreg_id,vFullname, vRSA, vToken 
         ,nTokenExpire, vBirthday, v2ndEmail,vDescription);
  SELECT last_insert_id() INTO nUserID;
  -- 2. CreateUserCalendar

  -- 3. CreateUserPrincipal
  
  COMMIT;
  --
SELECT nUserID;
END