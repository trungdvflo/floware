CREATE PROCEDURE `ip_history`(pvKeyword        VARCHAR(255)
                                                ,pnUserId         BIGINT(20)
                                                ,pnOFFSET         INTEGER(11)
                                                ,pnLIMIT          INTEGER(11)
                                                )
BEGIN
  --
  DECLARE vKeyword      VARCHAR(256)    DEFAULT concat('%', ifnull(pvKeyword, ''), '%');
  --
  SELECT u.email
      ,DATE(FROM_UNIXTIME(ac.created_date)) AS dday
      -- ,group_concat(ac.id)
      ,ac.ip, ar.app_name,count(*) use_time, ac.user_agent
  FROM access_token ac
  JOIN app_register ar ON (ac.app_id = ar.app_reg_id)
  JOIN `user` u ON (u.id = ac.user_id)
 WHERE u.email LIKE vKeyword
   AND u.id = ifnull(pnUserId, u.id)
 GROUP BY ac.ip, ar.id, dday
 ORDER BY u.id, dday
 LIMIT pnLIMIT
offset pnOFFSET;
  --
END