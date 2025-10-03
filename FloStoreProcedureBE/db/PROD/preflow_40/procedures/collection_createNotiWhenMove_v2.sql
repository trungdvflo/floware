CREATE PROCEDURE `collection_createNotiWhenMove_v2`(
         userId                  BIGINT(20)
         ,userEmail              VARCHAR(255)
         ,collectionIdX          BIGINT(20)
         ,collectionIdY          BIGINT(20)
         ,objectUidOld           VARBINARY(1000)
         ,objectUidNew           VARBINARY(1000)
         ,objectType             VARCHAR(20)
         ,content                VARCHAR(1000)
         ,actionTime             DOUBLE(13,3)
         ,updatedDate            DOUBLE(13,3))
BEGIN
  DECLARE outNotiX          BIGINT(20) DEFAULT 0;
  DECLARE outNotiY          BIGINT(20) DEFAULT 0;

    DECLARE vAction        INT(11) DEFAULT 0;
    DECLARE vContent      VARCHAR(1000) DEFAULT '';

    SET vAction = 16; -- Remove
    -- SET vContent = 'The object IS removed';
    SET vContent = content;
    SET outNotiX = collection_createNoti(userId, userEmail, collectionIdX, objectUidOld, objectType, actionTime, updatedDate, vAction, vContent);

    SET vAction = 0; -- CREATE
    -- SET vContent = 'The object IS created';
    SET vContent = content;
    SET outNotiY = collection_createNoti(userId, userEmail, collectionIdY, objectUidNew, objectType, actionTime, updatedDate, vAction, vContent);

   -- RETURN VALUES 
  -- SELECT  
    --  outNotiX out_noti_x_id
      -- , outNotiY out_noti_y_id; 
END