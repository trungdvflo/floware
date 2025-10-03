CREATE PROCEDURE `n2023_listOfNotificationOutdated`(pnOffset INT, pnLimit INT)
BEGIN
  --
  -- owner
(SELECT cn.id, co.user_id user_id
   -- ,st.notification_clean_date, cn.created_date, unix_timestamp(now(3) - INTERVAL st.notification_clean_date second)
  FROM collection_notification cn
  JOIN collection co ON (cn.collection_id = co.id)
  JOIN setting st ON (st.user_id = co.user_id)
  JOIN user uu ON (st.user_id = uu.id)
  LEFT JOIN user_notification un ON (cn.id = un.collection_notification_id AND un.user_id = co.user_id)
 WHERE cn.created_date < unix_timestamp(now() - INTERVAL st.notification_clean_date second)
   AND un.deleted_date IS NULL
   AND uu.email = 'auto763e90_test_23@flouat.net'
   AND co.type = 3 -- shared only
 GROUP BY cn.id, co.user_id
 ORDER BY cn.created_date
 )
UNION ALL
 -- member
(SELECT cn.id, csm.member_user_id user_id
   -- ,st.notification_clean_date, cn.created_date, unix_timestamp(now(3) - INTERVAL st.notification_clean_date second)
  FROM collection_notification cn
  JOIN collection_shared_member csm ON (cn.collection_id = csm.collection_id)
  JOIN setting st ON (st.user_id = csm.member_user_id)
  JOIN user uu ON (st.user_id = uu.id)
  LEFT JOIN user_notification un ON (cn.id = un.collection_notification_id AND un.user_id = csm.member_user_id)
 WHERE cn.created_date < unix_timestamp(now() - INTERVAL st.notification_clean_date second)
   AND un.deleted_date IS NULL
   AND uu.email = 'auto763e90_test_23@flouat.net'
 GROUP BY cn.id, csm.member_user_id
 ORDER BY cn.created_date
 )
 LIMIT pnLimit
offset pnOffset;
  --
END