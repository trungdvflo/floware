module.exports = {
  getSubDetail: `SELECT sp.id FROM subscription_purchase sp
   INNER JOIN user u ON u.id = sp.user_id WHERE u.username = $1`,

  // Keep all sql of ruby 3.2
  getCount3rdSql: `(
    select count(if(tpa.account_type=5,tpa.account_type, null)) as icloud,
      count(if(tpa.account_type=1,tpa.account_type, null)) as google,
      count(if(tpa.account_type=2,tpa.account_type, null)) as yahoo,
      count(if(tpa.account_type=3,tpa.account_type, null)) as other_3rd
       from third_party_account tpa ) as tpa`,

  getCountSubSql: `(
    select (select count(*) as pro from (
      select u2.email, sp2.sub_id from user u2
       left join subscription_purchase sp2 on sp2.user_id = u2.id
        left join subscription s on s.id = sp2.sub_id
      where s.subs_type = 2 and sp2.is_current=1
      group by u2.id ) as s) as pro,
       (select count(*) as pre from (
        select u2.email, sp2.sub_id
        from user u2
        left join subscription_purchase sp2 on sp2.user_id = u2.id
        left join subscription s on s.id = sp2.sub_id
        where s.subs_type = 1 and sp2.is_current=1
        group by u2.id) as s) as pre) as su`,

  getCountUsers: '(select count(*) as user from user where 1) as u2',
  // Get all messages size
  getMessagesSql: 'SELECT q.bytes FROM quota q Where q.username = $1',

  getAll3rdAccSql: `SELECT tpa.user_income , tpa.account_type 
  FROM third_party_account as tpa , user as u WHERE tpa.user_id = u.id AND u.username = $1`,

  // Get all caldav size
  getSizeCaldavSql: `SELECT 
    COALESCE(SUM(CASE WHEN c2.componenttype = 'VEVENT' THEN c2.size END), 0) AS events_size,
    COALESCE(SUM(CASE WHEN c2.componenttype = 'VTODO' THEN c2.size END), 0) AS todo_size, 
    COALESCE(SUM(CASE WHEN c2.componenttype = 'VJOURNAL' THEN c2.size END), 0) AS vjournals_size
  FROM calendarobjects c2 LEFT JOIN calendarinstances c ON c.calendarid = c2.calendarid 
  WHERE c.principaluri = $1`,

  getSizeFile: `SELECT 
    COALESCE(SUM(f.size), 0) AS total FROM file f, user u 
    WHERE u.id = f.user_id AND u.username = $1`,

  getContactSql: `SELECT COALESCE(SUM(c.size), 0) AS total FROM cards c
    LEFT JOIN addressbooks a ON a.id = c.addressbookid 
    WHERE a.principaluri = $1`,

  getVersionSql: `SELECT  ta.app_version, ta.build_number, ta.flo_version, ta.name, uta.last_used_date 
  FROM report_cached_user u
  JOIN user_tracking_app uta ON u.email = uta.username
  JOIN tracking_app ta ON ta.id = uta.tracking_app_id
  WHERE uta.username = $1
  ORDER BY uta.last_used_date DESC;`,

  getGroupSql: 'SELECT g.id, g.name, ifnull(g.description, "") description, g.group_type FROM `group` g INNER JOIN group_user gu ON gu.group_id = g.id INNER JOIN user u ON u.id = gu.user_id WHERE u.username = $1'
};
