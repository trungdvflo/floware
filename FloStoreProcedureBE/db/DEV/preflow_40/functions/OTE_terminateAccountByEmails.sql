CREATE FUNCTION `OTE_terminateAccountByEmails`() RETURNS INT(11)
BEGIN
   DECLARE no_more_rows boolean;
   DECLARE nUSERID BIGINT(20);
   DECLARE nCount INTEGER DEFAULT 0;
   DECLARE vEMAIL VARCHAR(100);
   DECLARE bDISABLED TINYINT(1);
   
   DECLARE user_cursor CURSOR FOR
   # Start of: main script
   SELECT usr.id user_id, usr.username, usr.disabled
     FROM `user` usr
    WHERE usr.username IN (
      -- start: list email need remove
      'floauto.api_nl_170823_0@flodev.net',
      'floauto.api_nl_170823_1@flodev.net',
      'floauto.api_nl_170823_2@flodev.net',
      'floauto.api_nl_170823_3@flodev.net',
      'floauto.api_nl_170823_4@flodev.net',
      'floauto.api_nl_170823_5@flodev.net',
      'floauto.api_nl_170823_6@flodev.net',
      'floauto.api_nl_170823_7@flodev.net',
      'floauto.api_nl_170823_8@flodev.net',
      'floauto.api_nl_170823_9@flodev.net',
      'floauto.api_nl_170823_10@flodev.net',
      'floauto.api_nl_170823_11@flodev.net'
      -- END: list email need remove
        )
    ORDER BY 1 DESC;
   # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN user_cursor;
   usr_loop: LOOP
     --
     FETCH user_cursor INTO nUSERID, vEMAIL, bDISABLED;
     --
     IF (no_more_rows) THEN
       CLOSE user_cursor;
       LEAVE usr_loop;
     END IF;
     -- disable user BEFORE DELETE
      IF bDISABLED = 0 THEN
       --
       UPDATE `user` u
          SET u.disabled = 1
      WHERE u.id = nUSERID;
     --
   END IF;
     -- USE INSERT IGNORE TO IGNORE dupplicate UNIQUE record
    INSERT IGNORE INTO user_deleted
    (user_id, username, is_disabled, progress, cleaning_date, created_date)
    VALUES(nUSERID, vEMAIL, bDISABLED, 0, unix_timestamp(DATE_ADD(NOW(), INTERVAL (nCount * 30) second)), unix_timestamp());
        SET nCount = nCount + 1;
     --
   END LOOP usr_loop;
   --
RETURN nCount;
END