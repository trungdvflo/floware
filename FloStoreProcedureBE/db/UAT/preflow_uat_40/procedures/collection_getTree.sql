CREATE PROCEDURE `collection_getTree`(nUSERID BIGINT(20))
BEGIN
  SELECT c1.id AS collection_id
        ,c1.parent_id AS parent_id
        ,c2.parent_id AS parent2_id
        ,c3.parent_id AS parent3_id
        ,c4.parent_id AS parent4_id
        ,c5.parent_id AS parent5_id
        ,c6.parent_id AS parent6_id  
    FROM collection c1
LEFT JOIN collection c2 ON (c2.id = c1.parent_id)
LEFT JOIN collection c3 ON (c3.id = c2.parent_id)
LEFT JOIN collection c4 ON (c4.id = c3.parent_id) 
LEFT JOIN collection c5 ON (c5.id = c4.parent_id) 
LEFT JOIN collection c6 ON (c6.id = c5.parent_id)
   WHERE c1.user_id = nUSERID
     AND (ifnull(c1.parent_id, 0) > 0
      OR ifnull(c2.parent_id, 0) > 0
      OR ifnull(c3.parent_id, 0) > 0
      OR ifnull(c4.parent_id, 0) > 0
      OR ifnull(c5.parent_id, 0) > 0
      OR ifnull(c6.parent_id, 0) > 0)
ORDER BY 1, 2, 3, 4, 5, 6, 7;
END