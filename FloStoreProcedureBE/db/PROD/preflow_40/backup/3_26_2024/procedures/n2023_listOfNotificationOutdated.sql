CREATE PROCEDURE `n2023_listOfNotificationOutdated`(
 pnCollectionID BIGINT(20)
,pnOffset       INT
,pnLimit        INT)
BEGIN
  --
  DECLARE nCollectionID BIGINT(20) DEFAULT ifnull(pnCollectionID, 0);
  DECLARE nNOW_AT_1AM INT DEFAULT UNIX_TIMESTAMP(DATE_FORMAT(NOW(), '%Y-%m-%d 01:00:00'));
  -- owner
(SELECT cn.id, co.user_id user_id
       ,st.notification_clean_date, cn.created_date, nNOW_AT_1AM - st.notification_clean_date vtime
       ,pnCollectionID,nNOW_AT_1AM, st.user_id
       ,cn.created_date < nNOW_AT_1AM - IF(isnull(pnCollectionID), 0, st.notification_clean_date) time_limit
   FROM user uu
   JOIN setting st ON (st.user_id = uu.id)
   JOIN collection co ON (st.user_id = co.user_id)
   JOIN collection_notification cn ON (cn.collection_id = co.id)
LEFT JOIN user_notification un ON (cn.id = un.collection_notification_id AND un.user_id = co.user_id)
      -- 1. immediately DELETE via worker collection
    WHERE (co.id = nCollectionID
      -- 2. clean WHEN reach setting time LIMIT
          OR cn.created_date < nNOW_AT_1AM - st.notification_clean_date)
      AND st.notification_clean_date > 0 -- 0: keep forever
      AND un.deleted_date IS NULL
      AND co.type = 3 -- shared only
    GROUP BY cn.id, co.user_id
    ORDER BY cn.created_date
 )
UNION ALL
 -- member
  (SELECT cn.id, csm.member_user_id user_id
         ,st.notification_clean_date, cn.created_date, nNOW_AT_1AM - st.notification_clean_date vtime
         ,pnCollectionID,nNOW_AT_1AM, st.user_id
         ,cn.created_date < nNOW_AT_1AM - IF(isnull(pnCollectionID), 0, st.notification_clean_date) time_limit
     FROM user uu 
     JOIN setting st ON (st.user_id = uu.id)
     JOIN collection_shared_member csm ON (st.user_id = csm.member_user_id)
     JOIN collection_notification cn ON (cn.collection_id = csm.collection_id)
LEFT JOIN user_notification un ON (cn.id = un.collection_notification_id AND un.user_id = csm.member_user_id)
     -- 1. immediately DELETE via worker collection
    WHERE (csm.collection_id = nCollectionID
     -- 2. clean WHEN reach setting time LIMIT
          OR cn.created_date < nNOW_AT_1AM - st.notification_clean_date)
      AND st.notification_clean_date > 0 -- 0: keep forever
      AND un.deleted_date IS NULL
    GROUP BY cn.id, csm.member_user_id
    ORDER BY cn.created_date
 )
 LIMIT pnLimit
offset pnOffset;
  --
END