CREATE PROCEDURE `f2023_getListInvalidLink`(pnInterval    INT
                                                              ,pnOffset      INT
                                                              ,pnLimit       INT)
BEGIN
  --
  SELECT fil.id, fil.link_id, fil.link_type, fil.user_id
    FROM `user` u
    JOIN user_process_invalid_link upil ON (u.id = upil.user_id)
    JOIN flo_invalid_link fil ON (fil.user_id = upil.user_id)
   WHERE /*(upil.id IS NULL
      OR upil.updated_date IS NULL
      OR upil.updated_date < (UNIX_TIMESTAMP(NOW(3) - INTERVAL pnInterval hour)))
     AND*/ u.disabled         = 0
     AND fil.deleted_date IS NULL
     AND fil.is_processing  = 0
     AND fil.considering = 0 -- NOT DELETE suspected
   ORDER BY fil.created_date DESC
   LIMIT pnLimit
  offset pnOffset;
  --
END