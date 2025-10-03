CREATE FUNCTION `kanban_generateSystemKanban_V2`(pnUserId           BIGINT(20)
                                                                ,pnCollectionId     BIGINT(20)
                                                                ) RETURNS INT(11)
BEGIN
  --
  DECLARE nUpdatedDate     DOUBLE(13,3);
  DECLARE nModifyDate      DOUBLE(13,3);
  DECLARE nIsOwner         TINYINT(1) DEFAULT 0;
  DECLARE nColType         TINYINT(1) DEFAULT 0;
  DECLARE nCountKanban     INT DEFAULT 0;
  DECLARE nReturn          BIGINT(20) DEFAULT 0;
  --
  IF ifnull(pnCollectionId, 0) = 0 OR ifnull(pnUserId, 0) = 0 THEN
    --
    RETURN 0;
    --
  END IF;
  --
  SELECT ifnull(pnUserId, 0) = ifnull(c.user_id, -1), ifnull(c.type, -1)
  INTO nIsOwner, nColType
  FROM collection c
  WHERE c.id = pnCollectionId;
  --
  SELECT count(*)
    INTO nCountKanban
    FROM kanban k
   WHERE k.collection_id = pnCollectionId
     AND k.user_id = pnUserId;
   --
   IF ifnull(nCountKanban, 0) > 0 THEN
     --
     RETURN 0;
     --
   END IF;
  --
  # END of: main script
  --
  SET nUpdatedDate = unix_timestamp(now(3));
  SET nModifyDate = nUpdatedDate + 0.02;
  -- share only
  IF nColType = 3 THEN
    --
    IF nIsOwner = 1 THEN
      -- Members, **Notifications**, Recently Added, Email, Event, ToDo's, Contacts, Notes, Websites
      INSERT INTO kanban (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time, show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
      VALUES
        -- Members
        (pnUserId, pnCollectionId, 'Members',       '#666666',    0, 0, NULL,  nUpdatedDate + 0.007, 0, 0, 0, 0.000, 1, 0,  nUpdatedDate + 0.007,  nUpdatedDate + 0.007),
        -- Notifications
        (pnUserId, pnCollectionId, 'Notifications', '#49BB89', 0.5, 0, NULL,  nUpdatedDate + 0.008, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.008,  nUpdatedDate + 0.008)
        ;
      --
     ELSE
       -- Members, *Notifications*, Recently Added, Event, ToDo's, Notes, Websites
       INSERT INTO kanban 
         (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time, show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
       VALUES
         -- Notifications
         (pnUserId, pnCollectionId, 'Notifications',  '#49BB89', -0.5, 0, NULL,  nUpdatedDate + 0.001, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.001,  nUpdatedDate + 0.001),
         -- Recently Added
         (pnUserId, pnCollectionId, 'Recently Added', '#007AFF',    0, 0, NULL,  nUpdatedDate + 0.008, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.002,  nUpdatedDate + 0.002),
         -- Events
         (pnUserId, pnCollectionId, 'Events',         '#f94956',    1, 0, NULL,  nUpdatedDate + 0.002, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.003,  nUpdatedDate + 0.003),
         -- Calls
         (pnUserId, pnCollectionId, 'Calls',          '#49BB89',    2, 0, NULL,  nUpdatedDate + 0.003, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.004,  nUpdatedDate + 0.004),
         -- ToDo
         (pnUserId, pnCollectionId, 'ToDo\'s',        '#7CCD2D',    3, 0, NULL,  nUpdatedDate + 0.004, 0, 0, 0, 0.000, 1, 0,  nUpdatedDate + 0.005,  nUpdatedDate + 0.005),
         -- Notes
         (pnUserId, pnCollectionId, 'Notes',          '#FFA834',    4, 0, NULL,  nUpdatedDate + 0.005, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.006,  nUpdatedDate + 0.006),
         -- Websites
         (pnUserId, pnCollectionId, 'Websites',       '#B658DE',    5, 0, NULL,  nModifyDate, 0, 0, 3, 0.000, 1, 0,  nModifyDate,  nModifyDate)
        ;
      --
      SET nReturn = modify_insertAPILastModify('kanban', pnUserId, nModifyDate);
      --
      RETURN 2;
      --
    END IF;
    --
  END IF;
     --
     IF nIsOwner = 1 THEN
       -- Recently Added, Email, Event, ToDo's, Contacts, Calls, Notes, Websites, Files
       INSERT INTO kanban 
         (user_id, collection_id, `name`, color, order_number, archive_status, order_kbitem, order_update_time, show_done_todo, add_new_obj_type, sort_by_type, archived_time, kanban_type, is_trashed, created_date, updated_date) 
       VALUES
         -- Recently Added
         (pnUserId, pnCollectionId, 'Recently Added', '#007AFF', 1, 0, NULL,  nUpdatedDate + 0.009, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.009,  nUpdatedDate + 0.009),
         -- Email
         (pnUserId, pnCollectionId, 'Email',          '#0074b3', 2, 0, NULL,  nUpdatedDate + 0.01, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.01,  nUpdatedDate + 0.01),
         -- Events
         (pnUserId, pnCollectionId, 'Events',         '#f94956', 3, 0, NULL,  nUpdatedDate + 0.011, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.011,  nUpdatedDate + 0.011),
         -- ToDo
         (pnUserId, pnCollectionId, 'ToDo\'s',        '#7CCD2D', 4, 0, NULL,  nUpdatedDate + 0.012, 0, 0, 0, 0.000, 1, 0,  nUpdatedDate + 0.012,  nUpdatedDate + 0.012),
     -- Contacts
         (pnUserId, pnCollectionId, 'Contacts',       '#a0867d', 5, 0, NULL,  nUpdatedDate + 0.013, 0, 0, 1, 0.000, 1, 0,  nUpdatedDate + 0.013,  nUpdatedDate + 0.013),
     -- Calls
         (pnUserId, pnCollectionId, 'Calls',          '#49BB89', 6, 0, NULL,  nUpdatedDate + 0.014, 0, 0, 1, 0.000, 1, 0,  nUpdatedDate + 0.014,  nUpdatedDate + 0.014),
         -- Notes
         (pnUserId, pnCollectionId, 'Notes',          '#FFA834', 7, 0, NULL,  nUpdatedDate + 0.015, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.015,  nUpdatedDate + 0.015),
         -- Websites
         (pnUserId, pnCollectionId, 'Websites',       '#B658DE', 8, 0, NULL,  nUpdatedDate + 0.016, 0, 0, 3, 0.000, 1, 0,  nUpdatedDate + 0.016,  nUpdatedDate + 0.016),
         -- Files
         (pnUserId, pnCollectionId, 'Files',          '#969696', 9, 0, NULL,  nModifyDate, 0, 0, 0, 0.000, 1, 0,  nModifyDate,  nModifyDate)
         ;
      --
      SET nReturn = modify_insertAPILastModify('kanban', pnUserId, nModifyDate);
      --
      RETURN 1;
      --
    END IF;
    --
  RETURN 0;
  --
END