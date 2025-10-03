CREATE PROCEDURE `c2023_conferenceCheckChannel`(pvEmails  TEXT
,pnCount   INT
,pnUserId  BIGINT(20)
,pvUserName   BIGINT(20))
ChannelExistByEmails:BEGIN
--
  -- IF there IS an existing channel that has the same participants WITH selected participants: 
  --    ...Start the new CALL FROM the existing channel, DON'T CREATE a new channel.
  -- IF there are multiple existing channels that have the same participants WITH selected participants: 
  --    ...Start the new CALL FROM the newest existing channel, DON'T CREATE a new channel.
  --
  DECLARE nReturn BIGINT(20) DEFAULT 0;
  --
  IF pnCount = 0 THEN
    --
    SELECT -1 id;
    LEAVE ChannelExistByEmails;
    --
  END IF;
  --
  SELECT ifnull(max(cm1.id), -1) id, cm1.channel_id, chx.room_url
        ,cm1.vip, cm1.email, cm1.is_creator, chx.uid
        ,COALESCE(cm1.title, chx.title) AS title
        ,cm1.created_date, cm1.updated_date, IFNULL(cm1.revoke_time, 0) AS revoke_time
        ,chx.start_time
    FROM conference_member cm1
    JOIN (
          SELECT cc.id, cc.room_url, cc.uid, cc.title, ch.start_time
            FROM conference_channel cc
            JOIN conference_member cm ON (cc.id = cm.channel_id)
      LEFT JOIN ( -- max history
                  SELECT cm2.channel_id, ch1.member_id, MAX(ch1.updated_date) AS updated_date, ch1.start_time
                    FROM conference_history ch1
                    JOIN conference_member cm2 ON (cm2.id = ch1.member_id)
                   WHERE cm2.user_id = pnUserId
                   GROUP BY ch1.member_id
                   ORDER BY ch1.updated_date DESC
                   LIMIT 1
                 ) ch ON (cm.id = ch.member_id)
           WHERE cm.revoke_time = 0
             AND cc.id IN (SELECT cm3.channel_id
                             FROM conference_member cm3
                            WHERE cm3.user_id = pnUserId
                              AND cm3.revoke_time = 0
                          )
           GROUP BY cm.channel_id
          HAVING (
                 COUNT(*) = pnCount
             AND FIND_IN_SET(pnUserId, GROUP_CONCAT(cm.user_id))
             AND futil_findNeedleInHaystack(pvEmails, GROUP_CONCAT(cm.email), 1) -- 
                 )
           ORDER BY GREATEST(ifnull(ch.start_time, 0), cc.created_date) DESC 
           LIMIT 1
         ) chx ON (chx.id = cm1.channel_id)
    WHERE cm1.user_id = pnUserId
      AND cm1.revoke_time = 0;
  --
END