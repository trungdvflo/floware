CREATE PROCEDURE `adm2023_listOfUser`(pvIds                    TEXT
                                                        ,pvGroupIds               TEXT
                                                        ,pnGroupFilterType        TINYINT(1)
                                                        ,pvKeyword                VARCHAR(256) -- search ON field: email & account_3rd_emails
                                                        ,pbAccountTypes           TINYINT(1)   -- 0: Google 1: Yahoo 2: iCloud 3: Other
                                                        ,pbSubscriptionTypes      TINYINT(1)   -- 0: Standard 1: Premium 2: Pro
                                                        ,pdLastUsedStart          DOUBLE(13, 3)
                                                        ,pdLastUsedEnd            DOUBLE(13, 3)
                                                        ,pdJoinDateStart          DOUBLE(13, 3)
                                                        ,pdJoinDateEnd            DOUBLE(13, 3)
                                                        ,pvMigrationStatus        VARCHAR(20)   -- 0: NOT migrate 1: CREATE new ON DB4.0 2: Migrated
                                                        ,pvPlatformIds            VARCHAR(256)
                                                        ,pvPlatformFilterType     TINYINT(1)    -- 0:any, 1:ALL
                                                        ,pbFloMacUpdate           TINYINT(1)
                                                        ,pvFloMacFilterType       TINYINT(1)
                                                        ,pbIsInternal             TINYINT(1)
                                                        ,pvSort                   VARCHAR(128)  -- [-DESC +ASC] fieldname
                                                        ,pnOFFSET                 INT(5)
                                                        ,pnLIMIT                  INT(5))
BEGIN
  --
  DECLARE vKeyword      VARCHAR(256)    DEFAULT concat('%', ifnull(pvKeyword, ''), '%');
  DECLARE nRows         INT(11)         DEFAULT 0;
  DECLARE bIsInternal   TINYINT(1)      DEFAULT ifnull(pbIsInternal, 0);
  DECLARE bIsNoGroup    TINYINT(1)      DEFAULT 0;
  DECLARE bLikeFloMac   VARCHAR(255)    DEFAULT '%ad944424393cf309efaf0e70f1b125cb%';
  DECLARE nOFFSET       INT(5);
  DECLARE nLIMIT        INT(5);
  DECLARE vGroupIds     TEXT;
  DECLARE vFieldSort    VARCHAR(50)     DEFAULT REPLACE(REPLACE(IFNULL(pvSort, 'join_date'), '-', ''), '+', '');
  DECLARE vSort         VARCHAR(50)     DEFAULT IF(NOT isnull(pvSort)
                         AND NOT instr(pvSort, '-') 
                                               AND NOT instr(pvSort, '+'), concat('+', pvSort), ifnull(pvSort, '-join_date'));
  --
  SET bIsNoGroup = ifnull(find_in_set(-1, pvGroupIds), 0) = 1;
  SET vGroupIds = CASE
        WHEN pvGroupIds IS NULL THEN ''
        ELSE REPLACE(REPLACE(pvGroupIds, '-1,', ''), '-1', '')
    END;
  --
  SET nRows = adm2023_listOfUserCount(pvIds
                                     ,bIsNoGroup
                                     ,vGroupIds
                                     ,pnGroupFilterType
                                     ,vKeyword
                                     ,pbAccountTypes
                                     ,pbSubscriptionTypes
                                     ,pdLastUsedStart
                                     ,pdLastUsedEnd
                                     ,pdJoinDateStart
                                     ,pdJoinDateEnd
                                     ,pvMigrationStatus
                                     ,pvPlatformIds
                                     ,pvPlatformFilterType
                                     ,pbFloMacUpdate
                                     ,pvFloMacFilterType
                                     ,bIsInternal);
  --
  SET nOFFSET = ifnull(pnOFFSET, 0);
  SET nLIMIT = ifnull(pnLIMIT, nRows);
  SET SESSION group_concat_max_len = 500000;
  --
  SELECT rcu.email -- , vGroupIds, bIsNoGroup
        ,gu.groups, gu.group_type, gu.group_id
        -- IF(ifnull(rcu.last_used_date, 0) > 0, rcu.last_used_date, rcu.join_date) last_used_date
        -- ,pvSort, vSort, vFieldSort, INSTR(vSort, '-') dd, INSTR(vSort, '+') aa
        ,rcu.last_used_date, rcu.id, rcu.user_id, rcu.account_3rd, rcu.account_3rd_emails, rcu.account_type
        ,rcu.`storage`, rcu.sub_id, rcu.subs_type, rcu.order_number, rcu.subs_current_date
        ,rcu.join_date, rcu.next_renewal, rcu.disabled, rcu.deleted, rcu.addition_info
        ,rcu.user_migrate_status, rcu.created_date, rcu.updated_date
        ,rcu.platform, rcu.old_platform
        ,sp.id AS `subscriptionPurchase.id`
        ,sp.sub_id `subscriptionPurchase.sub_id`
        ,sp.is_current `subscriptionPurchase.is_current`
        ,sp.created_date `subscriptionPurchase.created_date`
        ,rcu.user_id
        ,IF(ifnull(rcu.platform, '')     LIKE bLikeFloMac
        AND ifnull(rcu.old_platform, '') LIKE bLikeFloMac
            ,1 ,0) flo_mac_update
        ,ifnull(ro.role, '') role_value
        ,ifnull(ro.name, '') role_name
        ,ifnull(ro.id, 0) role_id
        ,nRows totalRows
    FROM report_cached_user rcu
    LEFT JOIN admin ad ON (rcu.email = ad.email)
    LEFT JOIN role ro ON (ad.role_id = ro.id)
    LEFT JOIN (
          SELECT group_concat(gg.`name` ORDER BY gg.`name`) groups, guu.user_id
                ,group_concat(gg.group_type) group_type
                ,group_concat(guu.group_id) group_id
            FROM `group` gg
            JOIN group_user guu ON (guu.group_id = gg.id)
           GROUP BY guu.user_id
     ) gu ON (rcu.user_id = gu.user_id)
     LEFT JOIN subscription_purchase sp ON (rcu.user_id = sp.user_id)
     WHERE (rcu.email LIKE vKeyword OR rcu.account_3rd_emails LIKE vKeyword)
       AND (isnull(pbIsInternal)
         OR (bIsInternal = 0 AND (NOT find_in_set(2, gu.group_type) OR  gu.groups IS NULL))
         OR (bIsInternal = 1 AND      find_in_set(2, gu.group_type) AND NOT isnull(gu.groups)))
       AND IF(vGroupIds = '', 1
             -- find IN group_ids
             ,IF(NOT bIsNoGroup,   futil_findNeedleInHaystack(vGroupIds, gu.group_id, pnGroupFilterType)
             -- nogroup OR find IN group_ids
             ,ISNULL(gu.groups) OR futil_findNeedleInHaystack(vGroupIds, gu.group_id, pnGroupFilterType))
            )
       AND (pvIds IS NULL OR find_in_set(rcu.id, pvIds))
       AND IF(bIsNoGroup AND vGroupIds = '', gu.groups IS NULL, 1)
       AND CASE 
            WHEN isnull(pbFloMacUpdate) THEN 1
            WHEN pbFloMacUpdate = 1 
              THEN rcu.platform LIKE bLikeFloMac
                 AND rcu.old_platform LIKE bLikeFloMac
            WHEN pbFloMacUpdate = 0
              THEN rcu.platform NOT LIKE bLikeFloMac
                 OR rcu.old_platform NOT LIKE bLikeFloMac
          END
      AND (pvMigrationStatus IS NULL 
           OR find_in_set(rcu.user_migrate_status, pvMigrationStatus))
      AND ifnull(rcu.disabled, 0)            = 0 -- Alway GET active users without frozen account AND pending DELETE
      AND ifnull(rcu.deleted, 0)             = 0 -- 
      AND (rcu.join_date                    >= ifnull(pdJoinDateStart, 0) AND rcu.join_date       <= ifnull(pdJoinDateEnd, unix_timestamp()))
      AND (rcu.last_used_date               >= ifnull(pdLastUsedStart, 0) AND rcu.last_used_date  <= ifnull(pdLastUsedEnd, unix_timestamp()))
      AND IF(ifnull(pbSubscriptionTypes, '') = '', 1 , ifnull(find_in_set(rcu.subs_type, pbSubscriptionTypes), 0))
      AND IF(ifnull(pvPlatformIds, '')       = '', 1 ,futil_findNeedleInHaystack(pvPlatformIds, rcu.platform, pvPlatformFilterType))
    GROUP BY rcu.id, gu.user_id
    ORDER BY CASE WHEN INSTR(vSort, '-') THEN
        --
        CASE vFieldSort
          WHEN 'groups'         THEN gu.groups
          WHEN 'id'             THEN rcu.id
          WHEN 'email'          THEN rcu.email
          WHEN 'account_3rd'    THEN rcu.account_3rd
          WHEN 'storage'        THEN rcu.storage_total
          WHEN 'subs_type'      THEN rcu.subs_type
          WHEN 'last_used_date' THEN rcu.last_used_date
          WHEN 'join_date'      THEN rcu.join_date
          WHEN 'next_renewal'   THEN rcu.next_renewal
        END
        --
      END DESC,
     CASE WHEN INSTR(vSort, '+') THEN
        --
        CASE vFieldSort
          WHEN 'groups'         THEN gu.groups
          WHEN 'id'             THEN rcu.id
          WHEN 'email'          THEN rcu.email
          WHEN 'account_3rd'    THEN rcu.account_3rd
          WHEN 'storage'        THEN rcu.storage_total
          WHEN 'subs_type'      THEN rcu.subs_type
          WHEN 'last_used_date' THEN rcu.last_used_date
          WHEN 'join_date'      THEN rcu.join_date
          WHEN 'next_renewal'   THEN rcu.next_renewal
        END
       --
      END ASC
     LIMIT nOFFSET, nLIMIT;
END