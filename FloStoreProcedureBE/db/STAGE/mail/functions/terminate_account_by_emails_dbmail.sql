CREATE DEFINER=`khoapm`@`172.29.7.109` FUNCTION `terminate_account_by_emails_dbmail`() RETURNS INT(11)
BEGIN
   DECLARE no_more_rows boolean;
   DECLARE nUSERID INTEGER;
   DECLARE vEMAIL VARCHAR(100);
   DECLARE bDISABLED TINYINT(1);
   
   DECLARE user_cursor CURSOR FOR
   # Start of: main script
   SELECT usr.id user_id, usr.username, usr.disabled
     FROM `user` usr
    WHERE usr.username IN (
      -- start: list email need remove
      'floauto.anph_check_migrate@flostage.com',
      'be.api_11@flostage.com'
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
     --
   END LOOP usr_loop;
   --
RETURN 1;
END