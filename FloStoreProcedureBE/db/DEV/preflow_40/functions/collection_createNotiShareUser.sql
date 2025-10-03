CREATE FUNCTION `collection_createNotiShareUser`(
         userId                  BIGINT(20)
         ,collectionId         BIGINT(20)
         ,objectUid            VARBINARY(1000)
         ,objectType            VARCHAR(20)
         ,objectHref             VARCHAR(1000)
         ,actionTime            DOUBLE(13,3)
         ,updatedDate         DOUBLE(13,3)
         ,vAction               INT(11)
         ,vContent            VARCHAR(1000)) RETURNS INT(11)
BEGIN
  DECLARE countShareX          INT(11) DEFAULT -1;
  DECLARE outNotiId               BIGINT(20) DEFAULT 0;

  DECLARE memberId                      BIGINT(20) DEFAULT 0;
    DECLARE memberUserId               BIGINT(20) DEFAULT 0;
    DECLARE membercalendarUri       VARCHAR(255) DEFAULT '';
    DECLARE memberSharedEmail      VARCHAR(255) DEFAULT '';

  -- SELECT share member FOR collecion X
   DECLARE no_more_share_x     boolean DEFAULT FALSE;
   DECLARE share_x_cursor CURSOR FOR
      (
      SELECT sh.id, sh.member_user_id, sh.calendar_uri, sh.shared_email 
      FROM collection_shared_member sh 
      WHERE sh.collection_id = collectionId AND sh.shared_status =  1
      );
   DECLARE CONTINUE HANDLER FOR NOT FOUND SET no_more_share_x = TRUE;
   -- END: SELECT share

   -- count share x
   SELECT count(*) INTO countShareX 
      FROM collection_shared_member ch 
      WHERE ch.collection_id = collectionId;
   -- END count
   -- IF has share
   IF (countShareX > 0 ) THEN
       -- INSERT noti
       INSERT INTO collection_notification
            (user_id, collection_id, object_uid, object_type, object_href, action, content, created_date, updated_date)
            VALUES (userId, collectionId, objectUid, objectType, objectHref, vAction, vContent, updatedDate, updatedDate);
       SET outNotiId = LAST_INSERT_ID();

      OPEN share_x_cursor;
       share_x_loop: LOOP
           FETCH share_x_cursor INTO memberId, memberUserId, membercalendarUri, memberSharedEmail;
          IF (no_more_share_x) THEN
              LEAVE share_x_loop;
          END IF;
           -- INSERT noti FOR users
           INSERT INTO user_notification
              (user_id, collection_notification_id, status, action_time, created_date, updated_date)
                VALUES (memberUserId, outNotiId, 0, actionTime, updatedDate, updatedDate);
       END LOOP share_x_loop;
       CLOSE share_x_cursor;
        
    END IF;
  
    RETURN countShareX;
END