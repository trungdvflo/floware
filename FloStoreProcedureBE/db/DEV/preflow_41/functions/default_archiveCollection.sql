CREATE FUNCTION `default_archiveCollection`() RETURNS INT(11)
BEGIN
   DECLARE nUpdatedDate     DOUBLE(13,3);
   DECLARE vUserId          BIGINT(20) DEFAULT -1;
   DECLARE vUsername        VARCHAR(255);
   DECLARE vType            VARCHAR(255);
   DECLARE vCalendarUri     VARCHAR(255);
   DECLARE vPrincipal     VARCHAR(255);
   DECLARE vCalId           BIGINT(20) DEFAULT -1;
   DECLARE vColId           BIGINT(20) DEFAULT -1;
   DECLARE vOrderNumber     BIGINT(20) DEFAULT 1;
   DECLARE vNumberOfCol     INT DEFAULT 0;
   DECLARE no_more_users     boolean;
   DECLARE user_cursor CURSOR FOR
      (
      SELECT u.id, u.username, c.`type` 
      FROM `user` u 
      LEFT JOIN collection c ON c.user_id = u.id AND c.`type` = 4
      WHERE c.`type` IS NULL 
      );
   DECLARE CONTINUE HANDLER FOR NOT FOUND SET no_more_users = TRUE;
  
   OPEN user_cursor;
   user_loop: LOOP
      FETCH user_cursor INTO vUserId, vUsername, vType;
      IF (no_more_users) THEN
          LEAVE user_loop;
      END IF;
      SET vCalendarUri = preflow_40.uuid_v4();
      SET nUpdatedDate = unix_timestamp(now(3));
     -- INSERT calendar 
      INSERT INTO calendars
        (synctoken, components)
      VALUES
        (1, 'VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM');
      SET vCalId = LAST_INSERT_ID();
      -- INSERT calendar instance
      SET vPrincipal = concat('principals/', vUsername);
      INSERT INTO calendarinstances
        (calendarid, principaluri, displayname, uri, description, calendarorder, timezone, calendarcolor)
      VALUES
        (vCalId, vPrincipal, 'Archive', vCalendarUri, 'Archive', '0', 'America/Chicago', '#d06b64');
      -- INSERT collection 
      INSERT INTO collection
        (user_id, name, color, calendar_uri, type, view_mode, updated_date, created_date)
      VALUES
        (vUserId, 'Archive', '#d06b64', vCalendarUri, 4, 1, nUpdatedDate, nUpdatedDate);
      SET vColId = LAST_INSERT_ID();
      -- INSERT system kanban
      INSERT INTO kanban 
         (user_id, collection_id, `name`, color, order_number, archive_status, order_update_time, show_done_todo, add_new_obj_type
         , sort_by_type, archived_time, kanban_type, created_date, updated_date) 
      VALUES
         -- Recently Added
         (vUserId, vColId, 'Recently Added', '#007AFF', 1, 0, nUpdatedDate + 0.001, 0, 0, 3, 0.000, 1, nUpdatedDate + 0.001, nUpdatedDate + 0.001),
         -- Email
         (vUserId, vColId,          'Email', '#0074b3', 2, 0, nUpdatedDate + 0.002, 0, 0, 3, 0.000, 1, nUpdatedDate + 0.002, nUpdatedDate + 0.002),
         -- Events
         (vUserId, vColId,         'Events', '#f94956', 3, 0, nUpdatedDate + 0.003, 0, 0, 3, 0.000, 1, nUpdatedDate + 0.003, nUpdatedDate + 0.003),
         -- Calls
         (vUserId, vColId,          'ToDos', '#7CCD2D', 4, 0, nUpdatedDate + 0.004, 0, 0, 0, 0.000, 1, nUpdatedDate + 0.004, nUpdatedDate + 0.004),
         -- Contacts
         (vUserId, vColId,       'Contacts', '#a0867d', 5, 0, nUpdatedDate + 0.009, 0, 0, 1, 0.000, 1, nUpdatedDate + 0.009, nUpdatedDate + 0.009),
         -- ToDo
         (vUserId, vColId,          'Calls', '#49BB89', 6, 0, nUpdatedDate + 0.005, 0, 0, 3, 0.000, 1, nUpdatedDate + 0.005, nUpdatedDate + 0.005),
         -- Notes
         (vUserId, vColId,          'Notes', '#FFA834', 7, 0, nUpdatedDate + 0.006, 0, 0, 3, 0.000, 1, nUpdatedDate + 0.006, nUpdatedDate + 0.006),
         -- Websites
         (vUserId, vColId,       'Websites', '#B658DE', 8, 0, nUpdatedDate + 0.007, 0, 0, 3, 0.000, 1, nUpdatedDate + 0.007, nUpdatedDate + 0.007),
         -- Files
         (vUserId, vColId,          'Files', '#969696', 9, 0, nUpdatedDate + 0.008, 0, 0, 3, 0.000, 1, nUpdatedDate + 0.008, nUpdatedDate + 0.008)
      ;
      SET vNumberOfCol = vNumberOfCol + 1;
   END LOOP user_loop;
   CLOSE user_cursor;

   RETURN vNumberOfCol;
END