CREATE FUNCTION `OTE_migrateLinkChannelUid`() RETURNS INT(11)
BEGIN
    DECLARE no_more_rows    boolean;
    DECLARE nCount          INT DEFAULT 0;
    DECLARE nReturn         INT DEFAULT 0;
    DECLARE nID             BIGINT(20);
    DECLARE vUID            VARCHAR(255);
    DECLARE vType           VARCHAR(3);
    DECLARE nUserId         BIGINT(20);
    DECLARE channel_cursor CURSOR FOR
    # Start of: main script;
    SELECT 'LCO', lco.id, cc.uid, lco.user_id
      FROM linked_collection_object lco
      JOIN conference_member cm ON (lco.object_uid = cm.uid AND lco.object_type = 'CONFERENCING')
      JOIN conference_channel cc ON  (cc.id = cm.channel_id AND cc.user_id <> cm.user_id)
     WHERE cc.uid <> ''
       AND cc.uid <> cm.uid
     UNION
    SELECT 'LOS', lo.id, cc.uid, lo.user_id
      FROM linked_object lo
      JOIN conference_member cm ON (lo.source_object_uid = cm.uid AND lo.source_object_type = 'CONFERENCING')
      JOIN conference_channel cc ON  (cc.id = cm.channel_id AND cc.user_id <> cm.user_id)
     WHERE cc.uid <> ''
       AND cc.uid <> cm.uid
     UNION
    SELECT 'LOD', lo.id, cc.uid, lo.user_id
      FROM linked_object lo
      JOIN conference_member cm ON (lo.destination_object_uid = cm.uid AND lo.destination_object_type = 'CONFERENCING')
      JOIN conference_channel cc ON  (cc.id = cm.channel_id AND cc.user_id <> cm.user_id)
     WHERE cc.uid <> ''
       AND cc.uid <> cm.uid
    UNION
    SELECT 'CHS', ch.id, cc.uid, ch.user_id
      FROM contact_history ch
      JOIN conference_member cm ON (ch.source_object_uid = cm.uid AND ch.source_object_type = 'CONFERENCING')
      JOIN conference_channel cc ON  (cc.id = cm.channel_id AND cc.user_id <> cm.user_id)
     WHERE cc.uid <> ''
       AND cc.uid <> cm.uid
     UNION
    SELECT 'CHD', ch.id, cc.uid, ch.user_id
      FROM contact_history ch
      JOIN conference_member cm ON (ch.destination_object_uid = cm.uid AND ch.destination_object_type = 'CONFERENCING')
      JOIN conference_channel cc ON  (cc.id = cm.channel_id AND cc.user_id <> cm.user_id)
     WHERE cc.uid <> ''
       AND cc.uid <> cm.uid
      ;
    # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN channel_cursor;
   channel_loop: LOOP
     -- start LOOP channel_cursor
     FETCH channel_cursor 
     INTO vType, nID, vUID, nUserId;
     -- stop LOOP WHEN no_more_rows
     IF (no_more_rows) THEN
       CLOSE channel_cursor;
       LEAVE channel_loop;
     END IF;
     # main UPDATE
     CASE vType
       --
        WHEN 'LCO' THEN
          --
          UPDATE linked_collection_object lco
             SET lco.object_uid = vUID
           WHERE lco.id = nID
             AND lco.user_id = nUserID;
          --
          SET nReturn = m2023_insertAPILastModify('linked_collection_object', nUserId, unix_timestamp(now(3)));
          --
        WHEN 'LOS' THEN
          --
          UPDATE linked_object lo
              SET lo.source_object_uid = vUID
            WHERE lo.id = nID
              AND lo.user_id = nUserID;
          --
          SET nReturn = m2023_insertAPILastModify('linked_object', nUserId, unix_timestamp(now(3)));
          --
        WHEN 'LOD' THEN
          --
          UPDATE linked_object lo
             SET lo.destination_object_uid = vUID
           WHERE lo.id = nID
             AND lo.user_id = nUserID;
          --
          SET nReturn = m2023_insertAPILastModify('linked_object', nUserId, unix_timestamp(now(3)));
          --
        WHEN 'CHS' THEN
          --
          UPDATE contact_history ch
              SET ch.source_object_uid = vUID
            WHERE ch.id = nID
              AND ch.user_id = nUserID;
          --
          SET nReturn = m2023_insertAPILastModify('contact_history', nUserId, unix_timestamp(now(3)));
          --
        WHEN 'CHD' THEN
          --
          UPDATE contact_history ch
             SET ch.destination_object_uid = vUID
           WHERE ch.id = nID
             AND ch.user_id = nUserID;
          --
          SET nReturn = m2023_insertAPILastModify('contact_history', nUserId, unix_timestamp(now(3)));
          --
      END CASE;
     --
     SET nCount = nCount + 1;
      # main UPDATE
     --
   END LOOP channel_loop;
   --
RETURN nCount;
END