CREATE PROCEDURE `c2023_listOfUserInCollection`(
pnCollectionId BIGINT(20)
,pnUserID BIGINT(20)
,pvEmail VARCHAR(100))
BEGIN
  --
  DECLARE vEmails TEXT;
  --
  SELECT group_concat(cnt.email)
    INTO vEmails
    FROM (SELECT u.username email
    FROM collection co
    JOIN `user` u ON (co.user_id = u.id)
   WHERE co.id = pnCollectionId
     AND co.user_id <> pnUserID
   UNION ALL
  SELECT csm.shared_email email
    FROM collection_shared_member csm
   WHERE csm.collection_id = pnCollectionId
     AND csm.shared_status = 1
     AND csm.member_user_id <> pnUserID) cnt;
  --
  SELECT cc.first_name, cc.last_name, uu.fullname
    FROM principals pp
    JOIN addressbooks ab ON (pp.uri = ab.principaluri)
    JOIN card_contact cc ON (cc.addressbookid = ab.id)
    JOIN user uu ON (uu.username = pvEmail)
   WHERE pp.uri = concat('principals/', pvEmail)
    AND JSON_EXTRACT(cc.email_address,'$[*].value') LIKE JSON_ARRAY(
    vEmails
    ); -- CONTACT
  --
END