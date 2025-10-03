# path = "/var/www/FloOnline/FloPushNoti/lib/"
# require "#{path}pushmeup/version"
# require "#{path}pushmeup/apple"    #for push notification Apple's device
# require "#{path}pushmeup/android"
# require "#{path}pushmeup/amazon"


require 'rubygems'
# require "pushmeup/version"
# require "pushmeup/apple"    #for push notification Apple's device
# require "pushmeup/android"
# require "pushmeup/amazon"
require 'daemons'           #for run Daemon
require 'mysql'             #for connect mySQL
require 'mail'
require 'net/imap'          #for connect IMAP server

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
#run eventmachine
# options = { :address              => "mail.flomail.net",
            # :port                 => 25,
            # :domain               => 'mail.flomail.net',
            # :user_name            => 'support@flomail.net',
            # :password             => 'Sm4rtt1m3',
            # :authentication       => :login,
            # :openssl_verify_mode  => 'none',
            # :enable_starttls_auto => true  }

options = { :address              => ENV['EMAIL_SERVER'] || "mail.flodev.net",
            :port                 => 25,
            :domain               => ENV['EMAIL_DOMAIN'] || 'mail.flodev.net',
            :user_name            => ENV['EMAIL_USERNAME'] || 'support@flodev.net',
            :password             => ENV['EMAIL_PASSWORD'] || 'cong2004',
            :authentication       => :login,
            :openssl_verify_mode  => 'none',
            :enable_starttls_auto => true  }

BASE_URL = ENV['BASE_URL'] || 'http://flomail.net'

Mail.defaults do
  delivery_method :smtp, options
end

#send an email
def send_mail(objMail)
  fromEmail = "Flo Admin<"+objMail[:from].to_s+">"
  mail = Mail.new do
    from    fromEmail
      to    objMail[:to]
    subject objMail[:subject]
    #parse content to html
    html_part do
      content_type 'text/html; charset=UTF-8'
      body  objMail[:body]
    end   
  end
  begin
    #send mail
    mail.deliver
    #delete the record after deleting
    deleteItem(objMail[:id])
  rescue => e
    puts e
  end
end

#get send mail items
def collect_mail_to_send(from_email)
  begin
    conn = connectDB()
    sql = " SELECT sm.* "
    sql << " FROM send_mail AS sm "
    sql << " LIMIT 10 "
    mails = conn.query(sql)
    total = mails.num_rows
    # puts total
    if total > 0
      # logoURL = "http://flomail.net:8086/images/"
      logoURL = BASE_URL + "/images/"
      floCR = "&copy; FloWare " + Time.now.strftime('%Y')
      tosURL = "http://www.floware.com/terms-of-service"
      tosTXT = "Terms of Service"
      ppURL = "http://www.floware.com/privacy-policy"
      ppTXT = "Privacy Policy"
      
      #path to file template
      #path = ""
      #server
      # path = "/var/www/FloOnline/FloPushNoti/DaemonSendMail/"
      path = ENV['EMAIL_TEMPLATE_DIR'] || "./"
      
      mails.each_hash do |obj|
        template = obj['template'].to_s
        body = File.read(path + template)
        body = body.gsub("@logoURL@",logoURL)
        body = body.gsub("@floCR@",floCR)
        body = body.gsub("@tosURL@",tosURL)
        body = body.gsub("@tosTXT@",tosTXT)
        body = body.gsub("@ppURL@",ppURL)
        body = body.gsub("@ppTXT@",ppTXT)
        #replace text for each template
        #for near full storage
        if template == "storage_near_full_subs.txt"
          body = body.gsub("@percent@", obj['percent'])
        end
        #for full storage
        if template == "storage_full_subs.txt"
          body = body.gsub("@floEmail@", obj['to_email'])
        end
        #for thank upgrade account
        if template == "ths_upgrade_subs.txt"
          body = body.gsub("@upgradeTo@", obj['upgradeTo'])
        end
        #expired date
        if template == "flo_notice_subs.txt"
          body = body.gsub("@expired@", obj['expired'])
        end
        item = {
          :id => obj['id'],
          :from => from_email,
          :to => obj['to_email'],
          :subject => obj['subject'],
          :body => body
        }
        #send mail
        send_mail(item)
      end
    end
    conn.close() if conn
  rescue => e
    puts e
    conn.close() if conn
  end
end

######################################################################
# delete message after push notification
def deleteItem(itemID)
  #connect DB
  conn = connectDB()
  sql = " DELETE FROM send_mail "
  sql << " WHERE id = " + itemID.to_s
  conn.query(sql)
  # conn.close() if conn
end

def main(options)
  begin
    collect_mail_to_send(options[:user_name])
  rescue
  end
end

##################################
@version = 'production'

# becomeADaemon() if @version.to_s == 'production'
loop do
  main(options)
  # puts "===== done ====="
  sleep(10) #sleep 15 seconds
end
