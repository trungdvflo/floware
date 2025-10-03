CREATE FUNCTION `terminate_account_by_emails`() RETURNS INT(11)
BEGIN
   DECLARE no_more_rows boolean;
   DECLARE nUSERID INTEGER;
   DECLARE vEMAIL VARCHAR(100);
   DECLARE bDISABLED TINYINT(1);
   DECLARE nCount INT(11) DEFAULT 0;
   
   DECLARE user_cursor CURSOR FOR
   # Start of: main script
   SELECT usr.id user_id, usr.email, usr.disabled
     FROM `user` usr
     LEFT OUTER JOIN
        user_deleted ud ON (usr.id = ud.user_id)
    WHERE usr.username IN (
      -- start: list email need remove
'9999demoflo@flomail.net',
'adnys@flomail.net'
      -- END: list email need remove
        )
      AND ud.user_id IS NULL
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
    VALUES(nUSERID, vEMAIL, 1, 0, unix_timestamp(DATE_ADD(NOW(), INTERVAL 15 DAY)) + (nCount * 5), unix_timestamp());
        
        SET nCount = nCount + 1;
     --
   END LOOP usr_loop;
   --
RETURN 1;
END