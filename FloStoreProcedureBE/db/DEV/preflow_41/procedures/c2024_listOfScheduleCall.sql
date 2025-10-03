CREATE PROCEDURE `c2024_listOfScheduleCall`(pnChannelId  BIGINT(20)                                              
                                                      ,pnExternalMettingId  TEXT
                                                      ,pnMinId             BIGINT(20)
                                                      ,pnPageSize          INTEGER(11)
                                                      ,pnPageNo            INTEGER(11)
                                                      ,pvSort              VARCHAR(128)
                                                      ,pnBeforeGT          DOUBLE(14,4)
                                                      ,pnAfterLT           DOUBLE(14,4)
                                                      )
BEGIN
  DECLARE nPageNo    INT(11) DEFAULT ifnull(pnPageNo, 0);
  DECLARE nOFFSET    INT(11) DEFAULT 0;
  DECLARE vFieldSort VARCHAR(50) DEFAULT REPLACE(REPLACE(IFNULL(pvSort, ''), '-', ''), '+', '');
  DECLARE vSort      VARCHAR(50) DEFAULT IF(IFNULL(pvSort, '') <> '' AND NOT instr(pvSort, '-') AND NOT instr(pvSort, '+'), concat('+', pvSort), pvSort);
  --
  IF ifnull(pvSort, 'NA') <> 'NA' THEN
    SET nOFFSET = IF(nPageNo > 0, (nPageNo - 1) * pnPageSize, 0);
  END IF;
  SET SESSION group_concat_max_len = 500000;
  --
  SELECT cm.id AS id, cm.external_meeting_id, cm.channel_id, cm.start_time, cm.end_time, cm.spend_time
  FROM chime_meeting cm
  WHERE cm.channel_id   = IF(ifnull(pnChannelId, 0) > 0, pnChannelId, cm.channel_id)
    AND cm.external_meeting_id      = IF(ifnull(pnExternalMettingId, '') <> '', pnExternalMettingId, cm.external_meeting_id)
    AND cm.start_time    < IF(IFNULL(pnBeforeGT, 0) > 0, pnBeforeGT, unix_timestamp() + 1)
    AND cm.start_time    > IF(IFNULL(pnAfterLT, 0) > 0, pnAfterLT, 0)
    AND cm.id > IF(IFNULL(pnMinId, 0) > 0, pnMinId, 0)
  ORDER BY 
        (CASE WHEN ifnull(vSort,'') <> '' THEN
          CASE WHEN INSTR(vSort, "-") THEN
            CASE vFieldSort 
                WHEN 'start_time' THEN cm.start_time
            END
          END
        END) DESC,
        (CASE WHEN ifnull(vSort,'') <> '' THEN
          CASE WHEN INSTR(vSort, "+") THEN
            CASE vFieldSort 
                WHEN 'start_time' THEN cm.start_time
            END
          END
        END) ASC
  LIMIT pnPageSize
  OFFSET nOFFSET;
END