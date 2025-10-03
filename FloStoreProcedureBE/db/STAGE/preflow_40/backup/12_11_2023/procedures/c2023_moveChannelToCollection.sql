CREATE PROCEDURE `c2023_moveChannelToCollection`(
pnColId     BIGINT(20)
,pvUID      VARCHAR(255)
,pnUserId   BIGINT(20)
,pvEmail    VARCHAR(100))
c2023_moveChannelToCollection:BEGIN
 -- 0. Collection NOT found
 -- -1. channel NOT found
 --
 DECLARE nReturn    INT DEFAULT 0;
 DECLARE nColId     BIGINT(20);
 DECLARE nId        BIGINT(20);
 DECLARE vUID       VARCHAR(255);
 -- collection NOT found
 IF ifnull(pnColId, 0) = 0 THEN 
    SELECT 0 id; 
    LEAVE c2023_moveChannelToCollection;
 END IF;
 -- Channel NOT found
 IF ifnull(pvUID, 'NA') = 'NA' THEN 
    SELECT -1 id;
    LEAVE c2023_moveChannelToCollection;
 END IF;
 -- CHECK valid collection
 SELECT ifnull(max(co.id), 0)
   INTO nColId
   FROM collection co
   WHERE co.id = pnColId
   AND co.type <> 3
   AND co.user_id = pnUserId;
 --
 IF ifnull(nColId, 0) = 0 THEN 
    SELECT 0 id; 
    LEAVE c2023_moveChannelToCollection;
 END IF;

 -- start transaction;
 -- 1. remove ALL lco
 SET nReturn = c2023_removeChannelToCollection(pnColId, pvUid, pnUserId, pvEmail);
 -- 2. CHECK existing lco
 SELECT ifnull(max(lco.id), 0) id, cc.uid, ifnull(max(lco.collection_id), 0) collection_id -- FOR NOT existed
   INTO nId, vUID, nColId
   FROM conference_channel cc
   JOIN conference_member cm ON (cm.channel_id = cc.id)
   JOIN (SELECT ifnull(max(lco.id), 0) id, co.id collection_id, ifnull(lco.object_uid, pvUid) object_uid
                    ,ifnull(co.is_trashed, 0) trashed_co, ifnull(lco.is_trashed, 0) trashed_lco
                FROM linked_collection_object lco
                JOIN collection co ON (lco.collection_id = co.id)
               WHERE co.user_id = pnUserId   -- my collection
                 AND lco.collection_id = pnColId
                 AND lco.user_id = pnUserId   -- my link
                 AND lco.object_uid = pvUid
             ) lco ON (lco.object_uid = cc.uid)
  WHERE cc.uid = pvUid
    AND cm.user_id = pnUserId  -- my channel
   AND cm.revoke_time = 0
   AND lco.trashed_co = 0
   AND lco.trashed_lco = 0;
 --
  IF ifnull(nColId, 0) = 0 THEN 
    SELECT 0 id; 
    LEAVE c2023_moveChannelToCollection;
  END IF;
  --
  IF ifnull(vUID, 'NA') = 'NA' THEN 
    SELECT -1 id;
    LEAVE c2023_moveChannelToCollection;
 END IF;
 --
 IF nId = 0 THEN
   --
   INSERT INTO linked_collection_object
          (user_id,collection_id,account_id,object_uid,object_type,object_href,is_trashed,email_time,created_date,updated_date)
    VALUES
          (pnUserId, pnColId, 0, vUID, 'CONFERENCING', NULL, 0, 0, unix_timestamp(now(3)), unix_timestamp(now(3)));
   --
   SELECT last_insert_id() INTO nId;
   --
 END IF;
 --
 SELECT lco.id, lco.collection_id, lco.object_uid, lco.object_type, lco.account_id, lco.object_href
       ,lco.is_trashed, lco.created_date, lco.updated_date, lco.email_time
   FROM linked_collection_object lco
  WHERE lco.id = nId;
 -- commit;
 --
END