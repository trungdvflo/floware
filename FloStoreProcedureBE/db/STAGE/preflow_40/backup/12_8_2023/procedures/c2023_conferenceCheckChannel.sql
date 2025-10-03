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
    LEAVE ChannelExistByEmails;
    --
  END IF;
  --
   SELECT cm1.id id, cm1.channel_id, chx.room_url
         ,cm1.vip, cm1.email, cm1.is_creator, chx.uid
         ,COALESCE(cm1.title, chx.title) title
         ,cm1.created_date, cm1.updated_date, ifnull(cm1.revoke_time,0) revoke_time
     FROM conference_member cm1
     JOIN (SELECT cc.id, cc.room_url, cc.uid, cc.title
                 ,ch.updated_date
             FROM conference_channel cc
             JOIN conference_member cm ON (cc.id = cm.channel_id)
        LEFT JOIN conference_history ch ON (cm.id = ch.member_id)
              AND cm.revoke_time = 0
         GROUP BY cm.channel_id
           HAVING (count(*) = pnCount
              AND find_in_set(pnUserId, group_concat(cm.user_id))
              AND futil_findNeedleInHaystack(group_concat(cm.email), pvEmails, 1)
              )
          ORDER BY GREATEST(ifnull(ch.updated_date, 0), cc.updated_date) DESC -- ifnull(ch.updated_date, 0), cc.updated_date DESC
       LIMIT 1
     ) chx ON (chx.id = cm1.channel_id)
     WHERE cm1.user_id = pnUserId 
     AND cm1.revoke_time = 0
     ;
  --
END