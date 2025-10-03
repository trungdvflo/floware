CREATE FUNCTION `generate_RCU_platform`() RETURNS INT(11)
BEGIN
    DECLARE no_more_rows boolean;
    DECLARE nREID       BIGINT(20);
    DECLARE oldPlatform JSON;
  DECLARE vEMAIL      VARCHAR(255);
    DECLARE nUSERID     BIGINT(20);
    DECLARE vPLATFORM TEXT;
    DECLARE user_cursor CURSOR FOR
    # Start of: main script;
    SELECT rcu.id, rcu.user_id, rcu.email
      ,CONCAT('[', group_concat(json_object('app_reg_id', act.app_reg_id, 'app_name', act.app_name, 'api_version', '4.0')),']') jsonsplatform
    FROM report_cached_user rcu
    JOIN (SELECT ac.user_id, ar.app_reg_id, ar.app_name
              FROM access_token ac
              JOIN app_register ar ON (ac.app_id = ar.app_reg_id)
              GROUP BY ac.user_id, ar.app_reg_id
      ) act ON (rcu.user_id = act.user_id)
    -- WHERE rcu.platform IS NULL
       GROUP BY rcu.user_id
     ORDER BY rcu.id DESC;  
    # END of: main script
    
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   SET SESSION group_concat_max_len = 50000;
   OPEN user_cursor;
   usr_loop: LOOP
     -- start LOOP user_cursor
     FETCH user_cursor INTO nREID, nUSERID, vEMAIL, vPLATFORM;
     -- stop LOOP WHEN no_more_rows
     IF (no_more_rows) THEN
       CLOSE user_cursor;
       LEAVE usr_loop;
     END IF;
     -- GET last report_cached_user(rcu).id per user TO apply safe UPDATE
     -- UPDATE GROUP info TO rcu
     UPDATE report_cached_user re
        SET re.platform = CASE 
                            WHEN LTRIM(RTRIM(vPLATFORM)) = '' THEN '[]' 
                            ELSE ifnull(vPLATFORM, '[]')
                      END
        WHERE re.id = nREID;
   END LOOP usr_loop;
   --
   SET SESSION group_concat_max_len = 1024;
   --
RETURN 1;
END