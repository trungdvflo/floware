CREATE FUNCTION `update_zeroUserIDRCU`() RETURNS INT(11)
BEGIN
  --
  DECLARE nID              BIGINT(20);
  DECLARE nUID              BIGINT(20);
  DECLARE vEmail           VARCHAR(255);
  DECLARE no_more_rows     boolean;
  DECLARE nCount           INT(11) DEFAULT 0;
  DECLARE link_cursor CURSOR FOR
  # Start of: main query
   SELECT u.email, rcu.id
   FROM user u
   JOIN report_cached_user rcu ON (u.username = rcu.email)
   WHERE rcu.user_id = 0;
  
   -- SELECT rcu.email, rcu.id
   -- FROM report_cached_user rcu  
   -- WHERE rcu.user_id = 0;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN link_cursor;
  link_loop: LOOP
    --
    FETCH link_cursor INTO vEmail, nID;
    --
    IF (no_more_rows) THEN
      CLOSE link_cursor;
      LEAVE link_loop;
    END IF;
    # main DELETE
    SELECT u.id
      INTO nUID
      FROM user u
      WHERE u.username = vEmail;
      IF ifnull(nUID, 0) > 0 THEN
        --
        UPDATE report_cached_user rcu
           SET rcu.user_id = nUID
         WHERE rcu.user_id = 0
           AND rcu.email = vEmail
           AND rcu.id = nID;
        
         SET nCount = nCount +1;
         --
       END IF;
    # main DELETE
  END LOOP link_loop;
  --
  RETURN nCount;
  --
END