CREATE FUNCTION `adm2023_listOfUserCount`(pvIds                    TEXT
                                                            ,bIsNoGroup               TINYINT(1)
                                                            ,vGroupIds                TEXT
                                                            ,pnGroupFilterType        TINYINT(1)
                                                            ,vKeyword                 VARCHAR(256) -- search ON field: email & account_3rd_emails
                                                            ,pbAccountTypes           TINYINT(1)   -- 0: Google 1: Yahoo 2: iCloud 3: Other
                                                            ,pbSubscriptionTypes      TINYINT(1)   -- 0: Standard 1: Premium 2: Pro
                                                            ,pdLastUsedStart          DOUBLE(13, 3)
                                                            ,pdLastUsedEnd            DOUBLE(13, 3)
                                                            ,pdJoinDateStart          DOUBLE(13, 3)
                                                            ,pdJoinDateEnd            DOUBLE(13, 3)
                                                            ,pvMigrationStatus        VARCHAR(20)   -- 0: NOT migrate 1: CREATE new ON DB4.0 2: Migrated
                                                            ,pvPlatformIds            VARCHAR(256)
                                                            ,pvPlatformFilterType     VARCHAR(20)
                                                            ,pbFloMacUpdate           TINYINT(1)
                                                            ,pvFloMacFilterType       VARCHAR(20)
                                                            ,bIsInternal              TINYINT(1)
                                                            ) RETURNS INT(11)
BEGIN
  --
  DECLARE nRows INT(11) DEFAULT 0;
  DECLARE bLikeFloMac   VARCHAR(255)    DEFAULT '%ad944424393cf309efaf0e70f1b125cb%';
  --
  SELECT count(rcu.id)
    INTO nRows
     FROM (SELECT rcu.id
         FROM report_cached_user rcu
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
       AND ((bIsInternal = 0 AND (NOT find_in_set(2, gu.group_type) OR  gu.groups IS NULL))
         OR (bIsInternal = 1 AND      find_in_set(2, gu.group_type) AND NOT isnull(gu.groups)))
       AND IF(vGroupIds = '', 1
             ,IF(NOT bIsNoGroup,   futil_findNeedleInHaystack(vGroupIds, gu.group_id, pnGroupFilterType)
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
           ) rcu;
   
  RETURN nRows;
  --
END