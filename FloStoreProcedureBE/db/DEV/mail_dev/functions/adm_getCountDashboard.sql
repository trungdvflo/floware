CREATE FUNCTION `adm_getCountDashboard`(pvGroupIds               TEXT
                                                          ,pnGroupType              TINYINT(1)   -- 0: GROUP FOR QA/Team lead 1: RELEASE_GROUP: GROUP FOR RELEASE \ 2: internal GROUP
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
                                                          ,pvPlatformFilterType     VARCHAR(20)
                                                          ,pbFloMacUpdate           TINYINT(1)
                                                          ,pvFloMacFilterType       VARCHAR(20)
                                                          ,pbIsInternal             TINYINT(1)
                                                          ) RETURNS INT(11)
BEGIN
  --
  DECLARE nRows INT(11) DEFAULT 0;
  DECLARE bIsNoGroup    TINYINT(1)      DEFAULT 0;
  DECLARE bLikeFloMac   VARCHAR(255)    DEFAULT '%ad944424393cf309efaf0e70f1b125cb%';
  --
  SET bIsNoGroup = ifnull(find_in_set(-1, pvGroupIds), 0) = 1;
  --
  SELECT count(rcu.id)
    INTO nRows
     FROM (SELECT rcu.id
                 FROM report_cached_user rcu
    LEFT JOIN subscription_purchase sp ON (rcu.user_id = sp.user_id)
    LEFT JOIN (SELECT group_concat(guu.group_name) groups, guu.user_id, group_concat(gg.group_type) group_type, group_concat(guu.group_id) group_id
                      FROM group_user guu 
                      JOIN `group` gg ON (guu.group_id = gg.id)
                    GROUP BY guu.user_id
                    ORDER BY guu.user_id
    ) gu ON (rcu.user_id = gu.user_id)
    WHERE (rcu.email LIKE pvKeyword OR rcu.account_3rd_emails LIKE pvKeyword)
      AND CASE 
            WHEN ifnull(pbFloMacUpdate, -1) = -1 THEN 1
             WHEN pbFloMacUpdate = 1 
              THEN rcu.platform LIKE bLikeFloMac
                 AND rcu.old_platform LIKE bLikeFloMac
            WHEN pbFloMacUpdate = 0
              THEN rcu.platform NOT LIKE bLikeFloMac
                 OR rcu.old_platform NOT LIKE bLikeFloMac
          END
      AND IF(ifnull(pnGroupType, -1) = -1, 1, ifnull(find_in_set(pnGroupType, gu.group_type), 0))      
      AND (
           pbIsInternal IS NULL 
           OR (pbIsInternal = 1 AND find_in_set(2, gu.group_type))
           OR (pbIsInternal = 0 AND NOT find_in_set(2, gu.group_type))
          )
     AND CASE WHEN bIsNoGroup THEN gu.groups IS NULL 
               WHEN ifnull(pvGroupIds, '') = '' THEN 1
               ELSE futil_findNeedleInHaystack(pvGroupIds, gu.group_id, pnGroupFilterType)
           END
     AND (
           pvMigrationStatus IS NULL 
               OR find_in_set(rcu.user_migrate_status, pvMigrationStatus)
          )
      AND ifnull(rcu.disabled, 0)            = 0 -- Alway GET active users without frozen account AND pending DELETE
      AND ifnull(rcu.deleted, 0)             = 0 -- 
      AND (rcu.join_date                    >= ifnull(pdJoinDateStart, 0) AND rcu.join_date       <= ifnull(pdJoinDateEnd, unix_timestamp()))
      AND (rcu.last_used_date               >= ifnull(pdLastUsedStart, 0) AND rcu.last_used_date  <= ifnull(pdLastUsedEnd, unix_timestamp()))
      AND IF(ifnull(pbSubscriptionTypes, '') = '', 1 , ifnull(find_in_set(rcu.subs_type, pbSubscriptionTypes), 0))
      AND IF(ifnull(pvPlatformIds, '')       = '', 1 ,futil_findNeedleInHaystack(pvPlatformIds, rcu.platform, pvPlatformFilterType))
    GROUP BY rcu.id
    ) rcu;
  RETURN nRows;
  --
END