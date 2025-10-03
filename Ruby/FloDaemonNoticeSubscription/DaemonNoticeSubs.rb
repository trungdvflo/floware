require 'rubygems'
require 'daemons'           #for run Daemon
require 'mysql'             #for connect mySQL
require 'rufus-scheduler'

######################################################################
# Become a daemon
# def becomeADaemon
  # Daemons.daemonize  
# end

######################################################################
#connect to DB
def connectDB()
  conn = nil
  begin
    host = ENV['MYSQL_HOST'] || "123flo.com"
    dbUser = ENV['MYSQL_USERNAME'] || "flowonline"
    dbUserPass = ENV['MYSQL_PASSWORD'] || "Sm4rtt1m3"
    dbName = ENV['MYSQL_DATABASE'] || 'flowdata'
    
    conn = Mysql.connect(host, dbUser, dbUserPass, dbName) 
  rescue
  end
  return conn
end


####################################################################
#get paid user expire date
def get_users_expire_SQL(config)
  sql = "
          SELECT    res.*
                  , sc.subs_type
                  , DATE_ADD( DATE(FROM_UNIXTIME(res.created_date)), INTERVAL sc.period DAY ) as expired
          FROM (
                SELECT  pc.user_id, pc.subID, pc.purchase_status
                      , pc.created_date, u.email
                FROM subscription_purchase pc
                LEFT JOIN users u ON u.id = pc.user_id
                WHERE pc.purchase_status > 0
                ORDER BY pc.created_date DESC
               ) AS res
          LEFT JOIN subscriptions sc ON sc.id = res.subID
          WHERE (
                  (
                      ( DATEDIFF(DATE(CURDATE()), DATE(FROM_UNIXTIME(res.created_date)) ) IN("+config[:mSendBefore].to_s+")    
                          AND sc.period = "+config[:monthly].to_s+" 
                      )
                      OR 
                      ( DATEDIFF(DATE(CURDATE()), DATE(FROM_UNIXTIME(res.created_date)) ) IN("+config[:ySendBefore].to_s+")
                          AND sc.period = "+config[:yearly].to_s+" 
                      )
                  )
                )
                AND res.purchase_status > 0
          GROUP BY res.user_id
        "
  puts "expired: "  + sql
  
  return sql
end

#get free users near full storage: 80% and 95% 
# free storage 5GB = 5368709120
def get_users_full_storage_SQL(config)
  sql = "
          SELECT res.* 
                ,IF(res.percent >= "+config[:percent80].to_s+" && res.percent < "+config[:percent100].to_s+",'"+config[:nearFullTemp].to_s+"','"+config[:fullTemp].to_s+"') as template
                ,IF(res.percent >= "+config[:percent80].to_s+" && res.percent < "+config[:percent100].to_s+",'"+config[:nearFullSubj].to_s+"','"+config[:fullSubj].to_s+"') as subject
          FROM (
                  (
                              SELECT q.username AS email, q.bytes, q.cal_bytes, q.card_bytes, q.file_bytes,q.num_sent
                                  , ( ( SUM(q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes) *100)/"+config[:free].to_s+" ) AS percent
                                  , sc.purchase_status
                              FROM quota q
                              LEFT JOIN users u ON u.email = q.username
                              LEFT JOIN subscription_purchase sc ON sc.user_id = u.id
                              WHERE ISNULL(sc.purchase_status)
                              GROUP BY q.username
                  )
                  UNION
                  (
                  SELECT q.username AS email, q.bytes, q.cal_bytes, q.card_bytes, q.file_bytes,q.num_sent
                                  , ( ( SUM(q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes) *100)/"+config[:pre].to_s+" ) AS percent
                                  , sc.purchase_status
                              FROM quota q
                              LEFT JOIN users u ON u.email = q.username
                              LEFT JOIN subscription_purchase sc ON sc.user_id = u.id
                  LEFT JOIN subscriptions s ON s.id = sc.subID
                              WHERE sc.purchase_status = 1
                  AND s.subs_type = 1
                              GROUP BY q.username
                  )
                  UNION
                  (
                  SELECT q.username AS email, q.bytes, q.cal_bytes, q.card_bytes, q.file_bytes,q.num_sent
                                  , ( ( SUM(q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes) *100)/"+config[:pro].to_s+" ) AS percent
                                  , sc.purchase_status
                              FROM quota q
                              LEFT JOIN users u ON u.email = q.username
                              LEFT JOIN subscription_purchase sc ON sc.user_id = u.id
                  LEFT JOIN subscriptions s ON s.id = sc.subID
                              WHERE sc.purchase_status = 1
                  AND s.subs_type = 2
                              GROUP BY q.username
                  )
            
                ) AS res
          WHERE 
              (res.percent >= "+config[:percent80].to_s+" AND res.percent < "+config[:percent95].to_s+" AND res.num_sent = 0)
              OR (res.percent >= "+config[:percent95].to_s+" AND res.percent < "+config[:percent100].to_s+" AND res.num_sent <= 1)
              OR (res.percent >= "+config[:percent100].to_s+" AND res.num_sent <= 2)
        "
  
  # puts "storage: "  + sql
  
  return sql
end

#execute sql and insert send mail
def execute_sql(sql, options)
  #check sql string length
  if sql and sql.length > 0
    conn = connectDB()
    subs = conn.query(sql)
    total = subs.num_rows
    # puts total
    #check length
    if total > 0
      subject = options[:subject] ? options[:subject] : ''
      template = options[:template] ? options[:template] : ''
      percent = options['percent'] ? options['percent'].to_i : 0
      upgradeTo = options['upgradeTo'] ? options['upgradeTo'] : ''
      expired = ""
      sqlInsert = "INSERT INTO send_mail (to_email, subject, template, percent, upgradeTo, expired) VALUES "
      str = ""
      quotaObjs = [] #update number set for quota table
      
      subs.each_hash do |obj|
        toEmail = obj['email']
        #for storage account
        if options[:isStorage] and options[:isStorage].to_i == 1
          subject = obj['subject']
          template = obj['template']
          percent = obj['percent']
          #update number for sent
          it = {
            :email => toEmail,
            :num_sent => obj['num_sent'].to_i
          }
          puts it
          quotaObjs << it
        else #for expired date
          expired = obj['expired'] ? obj['expired'] : ""
        end
        if toEmail and toEmail.length > 0
          str = str + "('"+toEmail.to_s+"','"+subject.to_s+"','"+template.to_s+"',"+percent.to_s+",'"+upgradeTo.to_s+"','"+expired.to_s+"'),"
        end 
      end
      str = str.chop
      sqlInsert << str
      # puts sqlInsert
      
      conn.query(sqlInsert)
      
      #update number sent
      update_num_sent(quotaObjs)
    end
    conn.close() if conn
  end
end

#update the number of sent send notice user
def update_num_sent(objs)
  if objs and objs.length > 0
    conn = connectDB()
    objs.each do |obj|
      num = obj[:num_sent].to_i + 1
      sql = ""
      sql << " UPDATE quota SET num_sent = "
      sql << num.to_s
      sql << " WHERE username = '"
      sql << obj[:email].to_s
      sql << "'"
      conn.query(sql)    
    end
    conn.close() if conn
  end
end

######################################################################
def main()
  #send mail for paid user near expire
  configPeriod = {
    :monthly => 30,
    :yearly => 365,
    :mSendBefore => "25,20,15",
    :ySendBefore => "360,355,350",
  }
  sqlExpire = get_users_expire_SQL(configPeriod)
  optExpired = {
    :subject => "[Flo] Change to Flo Subscription",
    :template => "flo_notice_subs.txt"
  }
  execute_sql(sqlExpire, optExpired)
  
  ######################################
  #send mail for users full storage
  config = {
    :free => 5368709120,
    :pre => 10737418240,
    :pro => 107374182400,
    :percent80 => 80,
    :percent95 => 95,
    :percent100 => 100,
    :nearFullSubj => "[Flo] Almost Time for an Upgrade",
    :nearFullTemp => "storage_near_full_subs.txt",
    :fullSubj => "[Flo] Time for an Upgrade",
    :fullTemp => "storage_full_subs.txt"
  }
  
  sqlFull = get_users_full_storage_SQL(config)
  optFull = {
    :isStorage => 1
  }
  execute_sql(sqlFull, optFull)
  
end

##################################
@version = 'production'

# becomeADaemon() 
scheduler = Rufus::Scheduler.new
scheduler.every '24h' do
  main()
end
scheduler.join

