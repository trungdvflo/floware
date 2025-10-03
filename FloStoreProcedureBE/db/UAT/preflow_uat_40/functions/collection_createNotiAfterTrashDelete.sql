CREATE FUNCTION `collection_createNotiAfterTrashDelete`(
         userId                 BIGINT(20)
         ,userEmail             VARCHAR(255)
         ,objectId              BIGINT(20)
         ,objectUid             VARBINARY(1000)
         ,objectType            VARCHAR(20)
         ,actionTime            DOUBLE(13,3)
         ,updatedDate           DOUBLE(13,3)
         ,vAction               INT(11)
         ,vContent              VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        ) RETURNS BIGINT(20)
BEGIN
   DECLARE collectionId       BIGINT(20) DEFAULT 0;
   DECLARE outNotiId          BIGINT(20) DEFAULT 0;

   -- find collection id 
   DECLARE no_more_collections     boolean;
   DECLARE collection_cursor CURSOR FOR
      (
      SELECT co.id 
      FROM collection co
        INNER JOIN linked_collection_object l ON l.collection_id = co.id
      WHERE co.user_id = userId
        AND co.`type` = 3
        AND l.object_uid = objectUid
        AND l.object_type = objectType
      );
   DECLARE CONTINUE HANDLER FOR NOT FOUND SET no_more_collections = TRUE;
   -- 
   OPEN collection_cursor;
      collection_loop: LOOP
          FETCH collection_cursor INTO collectionId;
         IF (no_more_collections) THEN
           LEAVE collection_loop;
         END IF;
         -- INSERT noti
        SET outNotiId = c2023_createNotificationV2(userId, userEmail, collectionId, 0, objectUid, objectType, vAction, actionTime, '', vContent, updatedDate);
         --
      END LOOP collection_loop;
   CLOSE collection_cursor;

    RETURN collectionId;
END