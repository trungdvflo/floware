require 'mysql2'
require 'houston'
require 'logger'
require_relative '../../lib/pushmeup/apple'
require_relative './env'

module PushNotification
  def self.connect_mysql
    Mysql2::Client.new(host: Environment.database_env[:host],
                       username: Environment.database_env[:username],
                       password: Environment.database_env[:password],
                       database: Environment.database_env[:database])
  end

  def self.connect_houston(device_type, cert_env, notifications)
    apn = Houston::Client.production
    apn = Houston::Client.development if cert_env.to_i != 0
    pem_file = pem_by_device_type(device_type, cert_env)
    apn.certificate = File.read(pem_file)
    apn.push(notifications)
  end

  def self.persistent_connect_houston(device_type, cert_env, notifications)
    pem_file = ''

    file_path  = File.join(File.dirname(__FILE__))
    file = File.open(file_path + '/../pushed.log', File::WRONLY | File::APPEND)
    logger = Logger.new file
    pem_file = pem_by_device_type(device_type, cert_env)
    connection = Houston::Connection.new(Houston::APPLE_PRODUCTION_GATEWAY_URI, File.read(pem_file), nil)
    connection.open
    notifications.each do |notification|
      connection.write(notification.message)
      logger.info('device: ' + notification.device.to_s + ', device_type: ' + device_type.to_s + ', cert_env: ' + cert_env.to_s)
    end
    logger.close
    connection.close
  end

  def self.push(device_type, cert_env, notifications)
    file_path  = File.join(File.dirname(__FILE__))
    file = File.open(file_path + '/../pushed.log', File::WRONLY | File::APPEND)
    logger = Logger.new file
    logger.datetime_format = '%Y-%m-%d %H:%M:%S'

    APNS.host = 'gateway.push.apple.com'
    APNS.host = 'gateway.sandbox.push.apple.com' if cert_env == 1
    APNS.port = 2195
    APNS.pem = pem_by_device_type(device_type, cert_env)

    APNS.send_notifications(notifications) unless notifications.empty?

    notifications.each do |notification|
      logger.info('device: ' + notification.device_token.to_s + ', device_type: ' + device_type.to_s + ', cert_env: ' + cert_env.to_s)
    end
    logger.close
  end

  def self.pem_by_device_type(device_type, cert_env)
    pem_file = ''
    case device_type
    when 1 # iPad
      pem_file = Environment.pems[:ipad_dev]
    when 2 # iPad
      pem_file = Environment.pems[:ipad_beta]
    when 0 # iPhone
      pem_file = cert_env.to_i == 0 ? Environment.pems[:floInter_Prod] : Environment.pems[:floInter_Dev]
    when 3 # iPhone
      pem_file = cert_env.to_i == 0 ? Environment.pems[:floQC_Prod] : Environment.pems[:floQC_Dev]
    when 4 # iPhone
      pem_file = cert_env.to_i == 0 ? Environment.pems[:floDev_Prod] : Environment.pems[:floDev_Dev]
    end
    pem_file
  end

  def self.exe_query(sql)
    conn = connect_mysql
    result = conn.query(sql, symbolize_keys: true)
    conn&.close
    result
  end
end
