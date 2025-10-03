CREATE FUNCTION `adm2023_listOfGroupCount`(pvKeyword       VARCHAR(128)
                                                             ,pbIsInternal    TINYINT(1)) RETURNS INT(5)
BEGIN
  --
  DECLARE totalRows INT(11) DEFAULT 0;
  DECLARE bIsInternal   TINYINT(1)      DEFAULT ifnull(pbIsInternal, 0);
  --
  SELECT count(gg.id)
    INTO totalRows
    FROM (SELECT g.id
            FROM `group` g
       LEFT JOIN group_user gu ON (gu.group_id = g.id)
       LEFT JOIN user u ON (gu.user_id = u.id AND ifnull(u.id, 0) > 0 AND ifnull(u.disabled, 0) = 0)
           WHERE g.name LIKE concat('%',ifnull(pvKeyword,''),'%')
            AND (pbIsInternal IS NULL
               OR (bIsInternal = 0 AND g.group_type <> '2')
               OR (bIsInternal = 1 AND g.group_type = '2')
            )
    GROUP BY g.id) gg;
  --
  RETURN totalRows;
  --
END