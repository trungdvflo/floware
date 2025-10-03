CREATE PROCEDURE `f2023_getListUserToScanEmailLink`(pnInterval    INT
                                                                      ,pnOffset      INT
                                                                      ,pnLimit       INT)
f2023_getListUserToScanEmailLink:BEGIN
  --
  DECLARE vDomain VARCHAR(45) DEFAULT '@flouat.net';
  DECLARE nConsidering      INT(11) DEFAULT 0;
  -- count considering: must be less than 10 user IN queue
  SELECT count(*)
    INTO nConsidering
    FROM user_process_invalid_link upil
    WHERE upil.email_scanning = 1;
  --
  IF nConsidering >= pnLimit THEN
    --
    LEAVE f2023_getListUserToScanEmailLink;
    --
  END IF;
  --
  SELECT u.id user_id, u.username, upil.email_scanned_date
    FROM `user` u
     JOIN user_process_invalid_link upil ON (u.id = upil.user_id)
    WHERE (upil.id IS NULL
       OR upil.email_scanned_date IS NULL
       OR upil.email_scanned_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL pnInterval hour)))
      AND ifnull(upil.email_scanning, 0) = 0
      AND u.disabled         = 0
    /*
     AND u.username IN (
                concat('floauto.api_test_22', vDomain),
                concat('floauto.api_test_22_share1', vDomain),
                concat('floauto.api_debug_01', vDomain),
                concat('floauto.api_debug_01_share1', vDomain)
                /*concat('anph.owner', vDomain),
                concat('ipad_apns_share1', vDomain),
                concat('floauto.api_debug_01', vDomain),
                concat('floauto.api_test_22', vDomain),
                concat('floauto.api_test_22_share1', vDomain),
                concat('floauto.api_nl_211122_1', vDomain),
                concat('floauto.api_nl_211122_1_share1', vDomain),
                concat('floauto.api_nl_211122_2', vDomain),
                concat('floauto.api_nl_211122_2_share1', vDomain),
                concat('floauto.api_nl_211122_3', vDomain),
                concat('floauto.api_nl_211122_3_share1', vDomain),
                concat('floauto.api_nl_211122_4', vDomain),
                concat('floauto.api_nl_211122_4_share1', vDomain),
                concat('floauto.api_nl_211122_5', vDomain),
                concat('floauto.api_nl_211122_5_share1', vDomain),
                concat('floauto.api_nl_211122_6', vDomain),
                concat('floauto.api_nl_211122_6_share1', vDomain),
                concat('floauto.api_nl_211122_7', vDomain),
                concat('floauto.api_nl_211122_7_share1', vDomain),
                concat('floauto.api_nl_211122_8', vDomain),
                concat('floauto.api_nl_211122_8_share1', vDomain),
                concat('floauto.api_nl_211122_9', vDomain),
                concat('floauto.api_nl_211122_9_share1', vDomain),
                concat('floauto.api_nl_211122_10', vDomain),
                concat('floauto.api_nl_211122_10_share1', vDomain),
                concat('floauto.api_nl_211122_11', vDomain),
                concat('floauto.api_nl_211122_11_share1', vDomain)
            )*/
    ORDER BY u.created_date, u.updated_date DESC
    LIMIT pnLimit
   offset pnOffset;
  --
END