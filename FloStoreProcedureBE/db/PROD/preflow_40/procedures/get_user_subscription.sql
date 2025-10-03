CREATE PROCEDURE `get_user_subscription`(userId BIGINT(20))
usr_sub:BEGIN
  DECLARE usedInByte BIGINT(20);
  DECLARE usedAccount BIGINT(20);
    DECLARE nSubId BIGINT(20);
    --
    SELECT ifnull(max(sp.id), 0)
    INTO nSubId
    FROM subscription_purchase sp
    WHERE sp.user_id = userId;
    --
    IF nSubId = 0 THEN
      --
      SELECT 'Standard' `name`, 0 price
        ,0 period, 0 subs_type
        ,'' description, '' transaction_id
        ,0 purchase_type, 0 purchase_status
        ,0 created_date, 0 updated_date
        ,UNIX_TIMESTAMP() AS today
        ,JSON_ARRAY(
            JSON_OBJECT(
                'name', 'Storage',
                'used', 0,
                'comp_type', 1,
                'sub_value', 0,
                'description', ''
            ),
            JSON_OBJECT(
                'name', '3rd party account',
                'used', 0,
                'comp_type', 2,
                'sub_value', 0,
                'description', ''
            )
        ) AS components;
      LEAVE usr_sub;
      --
    END IF;
    --
  CALL get_user_subscription_component(usedInByte, usedAccount, userId);
  SET SESSION group_concat_max_len = 50000;
  SELECT su.name,
    su.price,
    su.period,
    su.subs_type,
    sp.description,
    sp.transaction_id,
    sp.purchase_type,
    sp.purchase_status,
    sp.created_date,
    sp.updated_date, 
    UNIX_TIMESTAMP() AS today,
    components.detail AS components
  FROM subscription_purchase sp
  LEFT JOIN subscription su ON (su.id = sp.sub_id)
  JOIN (
    SELECT
      sd.sub_id,
      CONCAT('[', GROUP_CONCAT(
        JSON_OBJECT(
          'used', CASE sc.comp_type
              WHEN 1 THEN IFNUll(usedInByte, 0)
              WHEN 2 THEN usedAccount
              ELSE 0 END,
          'name', sc.name, 
          'comp_type', 
          sc.comp_type, 
          'description', 
          sd.description, 
          'sub_value', 
          sd.sub_value)) , ']') detail
    FROM subscription_detail sd
    LEFT JOIN subscription_component sc ON (sc.id = sd.com_id)
    GROUP BY sd.sub_id) components ON (components.sub_id = sp.sub_id)
  WHERE sp.user_id = userId AND sp.is_current = 1
  GROUP BY sp.user_id;
SET SESSION group_concat_max_len = 1024;
END