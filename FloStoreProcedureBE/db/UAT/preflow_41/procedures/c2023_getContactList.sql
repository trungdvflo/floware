CREATE PROCEDURE `c2023_getContactList`(pvEmail VARCHAR(100)
                                        ,pvSearch VARCHAR(100))
BEGIN
  --
  SELECT cc.first_name, cc.last_name, JSON_EXTRACT(cc.email_address,'$[*].value') emails
     FROM principals pp
     JOIN addressbooks ab ON (pp.uri = ab.principaluri)
     JOIN card_contact cc ON (cc.addressbookid = ab.id)
    WHERE pp.uri = concat('principals/', pvEmail) -- LOGIN
      AND JSON_EXTRACT(cc.email_address,'$[*].value') LIKE JSON_ARRAY(ifnull(pvSearch, '%')); -- CONTACT
  --
END