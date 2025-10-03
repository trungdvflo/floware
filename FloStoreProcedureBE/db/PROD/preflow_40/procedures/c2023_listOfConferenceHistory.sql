CREATE PROCEDURE `c2023_listOfConferenceHistory`(pvKeyword         TEXT
                                                                   ,pvChannelIDs      TEXT
                                                                   ,pnUserId          BIGINT(20)
                                                                   ,pvIDs             TEXT
                                                                   ,pnModifiedGTE     DOUBLE(14,4)
                                                                   ,pnModifiedLT      DOUBLE(14,4)
                                                                   ,pnMinId           BIGINT(20)
                                                                   ,pnPageSize        INTEGER(11)
                                                                   ,pnPageNo          INTEGER(11)
                                                                   ,pvSort            VARCHAR(128))
BEGIN
  -- DEPRECATED
  DECLARE nOFFSET       INT(11) DEFAULT 0;
  DECLARE vFieldSort    VARCHAR(50) DEFAULT REPLACE(REPLACE(IFNULL(pvSort, ''), '-', ''), '+', '');
  DECLARE vSort         VARCHAR(50) DEFAULT IF(IFNULL(pvSort, '') <> '' -- DEFAULT +: ASC
                         AND NOT instr(pvSort, '-') 
                         AND NOT instr(pvSort, '+'), concat('+', pvSort), pvSort);
  DECLARE vKeyword TEXT DEFAULT concat('%', ifnull(pvKeyword, ''), '%');
  --
  SET nOFFSET = IF(ifnull(pnPageNo, 0) > 0, (pnPageNo - 1) * pnPageSize, 0);
  --
  SELECT ch.id, ch.invitee, ifnull(ch.attendees, '[]') lsAttendees, ch.start_time, ch.end_time
        ,ch.action_time, ch.type, ch.status, ch.organizer, ch.meeting_id
        ,cc.id channel_id
        ,ch.external_meeting_id, ch.is_reply, ch.created_date, ch.updated_date
    FROM conference_history ch
    JOIN conference_member cm ON (ch.member_id = cm.id)
    JOIN conference_channel cc ON (cm.channel_id = cc.id)
   WHERE ch.user_id = pnUserId
     AND ch.updated_date  <  IF(ifnull(pnModifiedLT, 0) > 0, pnModifiedLT, unix_timestamp() + 1)
     AND ch.updated_date  >= IF(ifnull(pnModifiedGTE, 0) > 0, pnModifiedGTE, 0)
     AND ch.id            >  IF(ifnull(pnMinId, 0) > 0, pnMinId, 0)
     AND IF(pvIDs IS NOT NULL, FIND_IN_SET(ch.id, pvIDs), 1)
     AND IF(pvChannelIDs IS NOT NULL, FIND_IN_SET(cc.id, pvChannelIDs), 1)
   ORDER BY 
    --
    (CASE WHEN ifnull(vSort,'') <> '' THEN
       --
       CASE WHEN INSTR(vSort, "-") THEN
         --
         CASE vFieldSort
           --
           WHEN 'action_time' THEN ch.action_time
           --
          END
     --
         END
         WHEN ifnull(pnModifiedLT, 0) > 0 THEN ch.updated_date
     --
      END) DESC,
    (CASE WHEN ifnull(vSort,'') <> '' THEN
       --
       CASE WHEN INSTR(vSort, "+") THEN
         --
         CASE vFieldSort 
           --
           WHEN 'action_time' THEN ch.action_time
           --
          END
         --
        END
        WHEN ifnull(pnModifiedGTE, 0) > 0 THEN ch.updated_date 
        WHEN ifnull(pnMinId, 0) > 0 THEN ch.id
       -- ELSE ch.id
      END) ASC
    --
   LIMIT pnPageSize
  OFFSET nOFFSET;
  --
END