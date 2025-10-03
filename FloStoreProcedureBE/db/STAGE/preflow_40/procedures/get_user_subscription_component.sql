CREATE PROCEDURE `get_user_subscription_component`(OUT usedInByte BIGINT(20) 
                                                                     ,OUT usedAccount BIGINT(20) 
                                                                     ,userId BIGINT(20))
BEGIN
   SELECT (q.bytes + q.cal_bytes + q.card_bytes + q.file_bytes + q.qa_bytes + q.file_common_bytes)
   INTO usedInByte
   FROM quota q
   JOIN `user` u ON (u.username = q.username)
  WHERE u.id = userId;
  --   
  SELECT count(tpa.id)
    INTO usedAccount
    FROM `third_party_account` tpa
   WHERE tpa.user_id = userId;
END