CREATE PROCEDURE `n2023_listOfNotificationOutdated`(
 pnCollectionID BIGINT(20)
,pnOffset       INT
,pnLimit        INT)
BEGIN
  --
  DECLARE vDomain VARCHAR(20) DEFAULT '@flostage.com';
  DECLARE nNOW_AT_1AM INT DEFAULT UNIX_TIMESTAMP(DATE_FORMAT(NOW(), '%Y-%m-%d 01:00:00'));
  -- owner
  (SELECT cn.id, co.user_id user_id
    ,st.notification_clean_date, cn.created_date, nNOW_AT_1AM - st.notification_clean_date vtime
     FROM collection_notification cn
     JOIN collection co ON (cn.collection_id = co.id)
     JOIN setting st ON (st.user_id = co.user_id)
     JOIN user uu ON (st.user_id = uu.id)
LEFT JOIN user_notification un ON (cn.id = un.collection_notification_id AND un.user_id = co.user_id)
    WHERE co.id = ifnull(pnCollectionID, co.id) -- 1. immediately DELETE via worker collection
      AND CASE WHEN pnCollectionID IS NULL 
               THEN cn.created_date < nNOW_AT_1AM - st.notification_clean_date -- 2. clean WHEN reach setting time LIMIT
           AND uu.email IN (
              CONCAT('anph.member', vDomain)
              /*CONCAT('floauto.api_nl_060623_5_share1', vDomain)
             ,CONCAT('floauto.api_nl_060623_5', vDomain)
             ,CONCAT('floauto.api_nl_060623_10', vDomain)
             ,CONCAT('auto763e90_nl_161123_5_share1', vDomain)
             ,CONCAT('auto763e90_test_23_share1', vDomain)
             ,CONCAT('auto763e90_test_23', vDomain)*/
           ) ELSE 1
           END
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
     FROM collection_notification cn
     JOIN collection_shared_member csm ON (cn.collection_id = csm.collection_id)
     JOIN setting st ON (st.user_id = csm.member_user_id)
     JOIN user uu ON (st.user_id = uu.id)
LEFT JOIN user_notification un ON (cn.id = un.collection_notification_id AND un.user_id = csm.member_user_id)
    WHERE csm.collection_id = ifnull(pnCollectionID, csm.collection_id) -- 1. immediately DELETE via worker collection
      AND CASE WHEN pnCollectionID IS NULL 
           THEN cn.created_date < nNOW_AT_1AM - st.notification_clean_date -- 2. clean WHEN reach setting time LIMIT
           AND uu.email IN (
              CONCAT('anph.member', vDomain)
              /*CONCAT('floauto.api_nl_060623_5_share1', vDomain)
             ,CONCAT('floauto.api_nl_060623_5', vDomain)
             ,CONCAT('floauto.api_nl_060623_10', vDomain)
             ,CONCAT('auto763e90_nl_161123_5_share1', vDomain)
             ,CONCAT('auto763e90_test_23_share1', vDomain)
             ,CONCAT('auto763e90_test_23', vDomain)*/
           ) ELSE 1
           END
    AND st.notification_clean_date > 0 -- 0: keep forever
      AND un.deleted_date IS NULL
    GROUP BY cn.id, csm.member_user_id
    ORDER BY cn.created_date
 )
 LIMIT pnLimit
offset pnOffset;
  --
END