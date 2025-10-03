CREATE FUNCTION `calendar_deleteObject`(nCalendarId BIGINT(11)) RETURNS INT(11)
BEGIN
  --
  DECLARE nID              BIGINT(20);
  DECLARE vUID             BIGINT(20);
  DECLARE vTable           VARCHAR(255);
  DECLARE no_more_rows     boolean;
  DECLARE nCount           INT(11);
  DECLARE nReturn          INT(11);
  DECLARE link_cursor CURSOR FOR
  # Start of: main query
 SELECT 'calendarobjects' tbl, co.id id, NULL AS uid
   FROM calendarobjects co 
  WHERE co.calendarid = nCalendarId
  UNION
 SELECT 'cal_event' tbl, e.id id, e.uid
   FROM cal_event e 
  WHERE e.calendarid = nCalendarId
  UNION
 SELECT 'cal_note' tbl, n.id id, n.uid
   FROM cal_note n 
  WHERE n.calendarid = nCalendarId
  UNION
 SELECT 'cal_todo' tbl, t.id id, t.uid
   FROM cal_todo t 
   WHERE t.calendarid = nCalendarId;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN link_cursor;
  link_loop: LOOP
    --
    FETCH link_cursor INTO vTable, nID, vUID;
    --
    IF (no_more_rows) THEN
      CLOSE link_cursor;
      LEAVE link_loop;
    END IF;
    # main DELETE
    SET nReturn = collection_deleteCommentByUID(vUID);
    # DELETE FROM caldav TABLE
    IF vTable = 'calendarobjects' THEN
      DELETE FROM calendarobjects
       WHERE id  = nID;
      --
    ELSEIF vTable = 'cal_event' THEN
      DELETE FROM cal_event
       WHERE id  = nID;
      --
    ELSEIF vTable = 'cal_note' THEN
      DELETE FROM cal_note
       WHERE id  = nID;
      --
    ELSEIF vTable = 'cal_todo' THEN
      DELETE FROM cal_todo
       WHERE id  = nID;
      --
    END IF;
    SET nCount = nCount + 1;
    # main DELETE
  END LOOP link_loop;
  --
  RETURN 1;
  --
END