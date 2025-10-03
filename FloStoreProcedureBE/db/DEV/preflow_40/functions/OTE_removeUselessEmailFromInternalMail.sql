CREATE FUNCTION `OTE_removeUselessEmailFromInternalMail`(pnLimit INT) RETURNS INT(11)
BEGIN
   DECLARE no_more_rows boolean;
   DECLARE nID          BIGINT(20);
   DECLARE nCount       INTEGER DEFAULT 0;
   
   DECLARE user_cursor CURSOR FOR
   # Start of: main script
   SELECT mu.id
    FROM mail_dev.user mu
    LEFT JOIN preflow_40.user uu ON (uu.username = mu.username)
   WHERE uu.id IS NULL
     AND (mu.username REGEXP  '^floauto\.api_.'
      OR mu.username REGEXP '^auto.(api)?.?'
      OR mu.username REGEXP '^auto763e90'
           )
   LIMIT pnLimit;
   # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN user_cursor;
   usr_loop: LOOP
     --
     FETCH user_cursor INTO nID;
     --
     IF (no_more_rows) THEN
       CLOSE user_cursor;
       LEAVE usr_loop;
     END IF;
     # main DELETE
     DELETE FROM mail_dev.user
     WHERE id = nID;
     # main DELETE
     SET nCount = nCount + 1;
     --
   END LOOP usr_loop;
   --
RETURN nCount;
END