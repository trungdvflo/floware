CREATE PROCEDURE `admin_getGroups`(vKeyword    VARCHAR(255)
                                                     ,isInternal  TINYINT(1)
                                                     ,nLimit      INT(11)
                                                     ,nOffset     INT(11))
BEGIN
  SELECT g.id, name, count(gu.user_id) AS number_users,  ifnull(g.description,'') description, g.group_type 
    FROM `group` g
    JOIN group_user gu ON (gu.group_id = g.id OR gu.group_name = g.`name`) 
   WHERE g.`name` LIKE concat('%', vKeyword, '%') 
     AND (CASE 
            WHEN ifnull(isInternal, -1) = 1 
            THEN g.group_type = 2 
            ELSE g.group_type <> 2 
           END)
   GROUP BY g.id 
   ORDER BY g.`name`
   LIMIT nlimit 
  OFFSET noffset;
END