CREATE PROCEDURE `OTE_GSKperUser`(pnUserId BIGINT(20))
BEGIN
  --
  DECLARE no_more_rows    boolean;
  DECLARE nCount          INT DEFAULT 0;
  DECLARE nReturn          INT DEFAULT 0;
  DECLARE nUserId         BIGINT(20);
  DECLARE user_cursor CURSOR FOR
  # Start of: main script
  SELECT u.id
    FROM user u
   WHERE (pnUserId IS NULL 
      OR u.id = pnUserId)
     AND u.disabled = 0;
    -- AND email LIKE 'anph%';
  # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN user_cursor;
   user_loop: LOOP
     --
     FETCH user_cursor 
      INTO nUserId;

     --
     IF (no_more_rows) THEN
       CLOSE user_cursor;
       LEAVE user_loop;
     END IF;
    --
    SET nReturn = nReturn + OTE_generateSystemKanban('Notifications',   nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('Contacts',        nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('Email',           nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('Events',          nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('Files',           nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('Notes',           nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('Recently Added',  nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('ToDo\'s',         nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('Websites',        nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('Members',         nUserId);
    SET nReturn = nReturn + OTE_generateSystemKanban('Calls',           nUserId);
    --
  END LOOP user_loop;
  --
  SELECT nCount, nReturn;
  --
END