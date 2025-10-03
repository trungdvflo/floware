CREATE PROCEDURE `collection_createNotiWhenMove`(
         userId                  BIGINT(20)
         ,userEmail              VARCHAR(255)
         ,collectionIdX          BIGINT(20)
         ,collectionIdY          BIGINT(20)
         ,objectUidOld           VARBINARY(1000)
         ,objectUidNew           VARBINARY(1000)
         ,objectType             VARCHAR(20)
         ,content                VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
         ,actionTime             DOUBLE(13,3)
         ,updatedDate            DOUBLE(13,3))
BEGIN
  DECLARE outNotiX          BIGINT(20) DEFAULT 0;
  DECLARE outNotiY          BIGINT(20) DEFAULT 0;
    DECLARE colTypeX          TINYINT(1) DEFAULT 0;
    DECLARE colTypeY          TINYINT(1) DEFAULT 0;

    DECLARE vAction        INT(11) DEFAULT 0;
    DECLARE vContent       VARCHAR(1000) DEFAULT '';
   
    SELECT c.`type` INTO colTypeX FROM collection c WHERE c.id = collectionIdX;
    IF (colTypeX = 3) THEN
       SET vAction = 16; -- Remove
       -- SET vContent = 'The object IS removed';
       SET vContent = content;
       SET outNotiX = c2023_createNotificationV2(userId, userEmail, collectionIdX, 0, objectUidOld, objectType, vAction, actionTime, NULL, vContent, updatedDate);
    END IF;
   
    SELECT c.`type` INTO colTypeY FROM collection c WHERE c.id = collectionIdY;
    IF (colTypeY = 3) THEN
       SET vAction = 0; -- CREATE
       -- SET vContent = 'The object IS created';
       SET vContent = content;
       SET outNotiY = c2023_createNotificationV2(userId, userEmail, collectionIdY, 0, objectUidNew, objectType, vAction, actionTime, NULL, vContent, updatedDate + 0.001);
    END IF;
    
   -- RETURN VALUES 
  -- SELECT  
    --  outNotiX out_noti_x_id
      -- , outNotiY out_noti_y_id; 
END