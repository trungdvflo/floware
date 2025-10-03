CREATE PROCEDURE `c2023_listOfContactInCollection`(
pnCollectionId BIGINT(20)
,pnUserId BIGINT(20)
,pvEmail VARCHAR(100))
collectionContact:BEGIN
  --
  DECLARE vEmails       TEXT;
  DECLARE vEmail        VARCHAR(100);
  DECLARE vFullname     VARCHAR(100);
  DECLARE vAvatar       VARCHAR(100);
  DECLARE vIDs          TEXT;
  DECLARE vDisplay      INT;
  DECLARE nAccessRight  INT;
  -- 0 - Last, First
  -- 1 - First Last
  -- 2 - Last Middle First
  -- GET setting
  -- CHECK permission
  SET nAccessRight = c2022_checkPermissionActivity(pnCollectionId, NULL, pnUserID);
  IF nAccessRight < 1 THEN
    --
    -- SELECT nAccessRight result;
    LEAVE collectionContact;
    --
  END IF;
  
  SELECT ifnull(st.contact_display_name, 0)
         ,uu.email, uu.fullname, ifnull(st.avatar, '') avatar
    INTO vDisplay, vEmail, vFullname, vAvatar
     FROM user uu
     JOIN setting st ON(uu.id = st.user_id)
    WHERE uu.id = pnUserID;
  -- GET collection information
  SELECT GROUP_CONCAT(cnt.email SEPARATOR '|'), group_concat(cnt.user_id)
    INTO vEmails, vIDs
    FROM (SELECT u.id user_id, u.username email
            FROM collection co
            JOIN `user` u ON (co.user_id = u.id)
           WHERE co.id = pnCollectionId
             AND co.user_id <> pnUserId -- NOT me
           UNION ALL
          SELECT csm.member_user_id user_id, csm.shared_email email
            FROM collection_shared_member csm
           WHERE csm.collection_id = pnCollectionId
             AND csm.shared_status = 1
             AND csm.member_user_id <> pnUserId
     ) cnt;
  --
   SELECT vEmail email, vFullname fullname, vAvatar avatar, '' first_name, '' last_name, '' middle_name
    UNION
   SELECT u1.email, u1.fullname, COALESCE(c1.contact_avatar, st.avatar, '') avatar
         ,ifnull(c1.first_name, '') first_name, ifnull(c1.last_name, '') last_name, ifnull(c1.middle_name, '') middle_name
     FROM user u1
     JOIN setting st ON(u1.id = st.user_id)
LEFT JOIN (SELECT rtrim(ltrim(
                CASE vDisplay 
                 WHEN 0 THEN concat(cc.last_name, ' ', cc.first_name)
                 WHEN 1 THEN concat(cc.first_name, ' ', cc.last_name)
                 WHEN 2 THEN concat(cc.last_name, ' ', cc.midle_name, ' ', cc.first_name)
             END)) sort, uu.id user_id, cc.first_name, cc.last_name, cc.midle_name middle_name
             ,cc.contact_avatar
         FROM principals pp
         JOIN addressbooks ab ON (pp.uri = ab.principaluri)
         JOIN card_contact cc ON (cc.addressbookid = ab.id)
         LEFT JOIN user uu ON (find_in_set(uu.id, vIDs) AND uu.username = JSON_UNQUOTE(JSON_EXTRACT(cc.email_address,'$[0].value')))
        WHERE pp.uri = concat('principals/', pvEmail)
          AND JSON_EXTRACT(cc.email_address,'$[*].value') RLIKE vEmails
        GROUP BY uu.id
        ORDER BY sort ASC
       ) c1 ON (c1.user_id = u1.id)
       WHERE find_in_set(u1.id, vIDs);
  --
END