CREATE FUNCTION `generate_RCU_group`(vGNAME VARCHAR(255)) RETURNS INT(11)
BEGIN
    DECLARE no_more_rows boolean;
    DECLARE nREID   BIGINT(20);
  DECLARE vEMAIL  VARCHAR(255);
    DECLARE nUSERID BIGINT(20);
    DECLARE vGROUPS TEXT;
    DECLARE user_cursor CURSOR FOR
    # Start of: main script;
    SELECT rcu.id, rcu.user_id, rcu.email, ifnull(g.json_groups, '[]') groupJson
      FROM report_cached_user rcu
 LEFT JOIN (SELECT gu.username
                  ,CONCAT('[', 
                   GROUP_CONCAT(
                         CONCAT('{'
                                     ,'"id":', g.id
                                     ,',"name":', '"',g.`name`,'"'
                                     ,',"description":','"',g.description,'"'
                                     ,',"group_type":','"',g.group_type,'"'
                                     ,',"created_date":', g.created_date
                                     ,',"updated_date":', g.updated_date
                               ,"}")
                               ), ']'
                           ) json_groups
                  FROM group_user gu
                  JOIN `group` g ON (gu.group_name = g.`name`)
                  GROUP BY gu.username
                ) g ON (rcu.email = g.username)
          WHERE g.json_groups IS NULL 
             OR g.json_groups LIKE CASE ifnull(vGNAME, 'NA')
                                 WHEN 'NA' THEN '%%'
                                 ELSE CONCAT('%{"name":', vGNAME, '%')
                                END;
    # END of: main script
    
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   SET SESSION group_concat_max_len = 50000;
   OPEN user_cursor;
   usr_loop: LOOP
     -- start LOOP user_cursor
     FETCH user_cursor INTO nREID, nUSERID, vEMAIL, vGROUPS;
     -- stop LOOP WHEN no_more_rows
     IF (no_more_rows) THEN
       CLOSE user_cursor;
       LEAVE usr_loop;
     END IF;
     -- GET last report_cached_user(rcu).id per user TO apply safe UPDATE
     --
     IF nREID > 0 THEN
       -- UPDATE GROUP info TO rcu
       UPDATE report_cached_user re
          SET re.groups = CASE 
                      WHEN LTRIM(RTRIM(vGROUPS)) = '' THEN '[]' 
                      ELSE ifnull(vGROUPS, '[]')
                      END
        WHERE re.id = nREID;
       --
     END IF;
     --
   END LOOP usr_loop;
   --
   SET SESSION group_concat_max_len = 1024;
   --
RETURN 1;
END