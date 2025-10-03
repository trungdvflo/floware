CREATE PROCEDURE `adm2023_listOfGroup`(pvKeyword       VARCHAR(128)
                                                           ,pbIsInternal    TINYINT(1)
                                                           ,pnOFFSET        INT(5)
                                                           ,pnLIMIT         INT(5))
BEGIN
  --
  DECLARE nRows INT(11) DEFAULT 0;
  DECLARE bIsInternal   TINYINT(1)      DEFAULT ifnull(pbIsInternal, 0);
  --
  IF ifnull(pnOFFSET, 0) = 0 THEN
    --
    SET nRows = adm2023_listOfGroupCount(pvKeyword, bIsInternal);
    --
  END IF;
  --
  SELECT g.id, g.name
        ,count(u.id) number_users
        ,ifnull(g.description, '') description, g.group_type
        ,g.internal_group, (g.group_type = '2' AND g.internal_group <> '0') is_default, nRows totalRows
      FROM `group` g
      LEFT JOIN group_user gu ON (gu.group_id = g.id)
      LEFT JOIN user u ON (gu.user_id = u.id AND ifnull(u.id, 0) > 0 AND ifnull(u.disabled, 0) = 0)
      WHERE g.name LIKE concat('%',ifnull(pvKeyword,''),'%')
        AND (
               (bIsInternal = 0 AND g.group_type <> '2')
               OR (bIsInternal = 1 AND g.group_type = '2')
            )
      GROUP BY g.id
      ORDER BY g.name
      LIMIT pnLIMIT
      OFFSET pnOFFSET;
  --
END