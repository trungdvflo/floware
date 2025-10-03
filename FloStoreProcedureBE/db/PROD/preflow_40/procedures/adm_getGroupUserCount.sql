CREATE PROCEDURE `adm_getGroupUserCount`(pvKeyword       VARCHAR(128)
                                                           ,pbIsInternal    TINYINT(1)
                                                           ,pnOFFSET        INT(5)
                                                           ,pnLIMIT         INT(5))
BEGIN
  --
  SELECT g.id, g.name
        ,count(u.id) number_users
        ,ifnull(g.description, '') description, g.group_type
      FROM `group` g
      LEFT JOIN group_user gu ON (gu.group_id = g.id)
      LEFT JOIN user u ON (gu.user_id = u.id AND ifnull(u.id, 0) > 0 AND ifnull(u.disabled, 0) = 0)
      WHERE g.name LIKE concat('%',ifnull(pvKeyword,''),'%')
        AND (
               pbIsInternal IS NULL 
               OR (pbIsInternal = 0 AND g.group_type <> '2')
               OR (pbIsInternal = 1 AND g.group_type = '2')
            )
      GROUP BY g.id
      ORDER BY g.name
      LIMIT pnLIMIT
      OFFSET pnOFFSET;
  --
END