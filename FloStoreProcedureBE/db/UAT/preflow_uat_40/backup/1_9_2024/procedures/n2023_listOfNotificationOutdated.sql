CREATE PROCEDURE `n2023_listOfNotificationOutdated`(
 pnCollectionID BIGINT(20)
,pnOffset       INT
,pnLimit        INT)
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
    WHERE (co.id = ifnull(pnCollectionID, co.id) -- 1. immediately DELETE via worker collection
       OR (pnCollectionID IS NULL 
           AND cn.created_date < unix_timestamp(now() - INTERVAL st.notification_clean_date second) -- 2. clean WHEN reach setting time LIMIT
           AND uu.email LIKE '%anph%'
           )
          )
      AND un.deleted_date IS NULL
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
    WHERE (csm.collection_id = ifnull(pnCollectionID, csm.collection_id) -- 1. immediately DELETE via worker collection
        OR (pnCollectionID IS NULL 
            AND cn.created_date < unix_timestamp(now() - INTERVAL st.notification_clean_date second) -- 2. clean WHEN reach setting time LIMIT
            AND uu.email LIKE '%anph%'
            )
          )
      AND un.deleted_date IS NULL
    GROUP BY cn.id, csm.member_user_id
    ORDER BY cn.created_date
 )
 LIMIT pnLimit
offset pnOffset;
  --
END