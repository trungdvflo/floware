require 'mysql2'
require 'logger'
require_relative '../lib/pushmeup/apple'
require_relative './env'

module PushNotification
  def self.connect_mysql
    Mysql2::Client.new(host: Environment.database_env[:host],
                       username: Environment.database_env[:username],
                       password: Environment.database_env[:password],
                       database: Environment.database_env[:database])
  end

  def self.push(device_type, cert_env, notifications)
    APNS.host = 'gateway.push.apple.com'
    APNS.host = 'gateway.sandbox.push.apple.com' if cert_env == 1
    APNS.port = 2195
    APNS.pem = pems_path(device_type, cert_env)

    logging_device_in_queue(device_type, cert_env, notifications)
    APNS.send_notifications(notifications) unless notifications.empty?
    logging(device_type, cert_env, notifications)
  end

  def self.pems_path(device_type, cert_env)
    path  = Environment.pems_path
    path + '/' + device_type.to_s + cert_env.to_s + '.pem'
  end

  def self.logging(device_type, cert_env, notifications)
    file_path  = File.join(File.dirname(__FILE__))
    file = File.open(file_path + '/../pushed.log', File::WRONLY | File::APPEND | File::CREAT)
    logger = Logger.new file
    logger.datetime_format = '%Y-%m-%d %H:%M:%S'

    notifications.each do |notification|
      logger.info('device: ' + notification.device_token.to_s + ', device_type: ' + device_type.to_s + ', cert_env: ' + cert_env.to_s)
    end
    logger.close
  end

  def self.logging_device_in_queue(device_type, cert_env, notifications)
    file_path  = File.join(File.dirname(__FILE__))
    file = File.open(file_path + '/../device_in_queue.log', File::WRONLY | File::APPEND | File::CREAT)
    logger = Logger.new file
    logger.datetime_format = '%Y-%m-%d %H:%M:%S'

    notifications.each do |notification|
      logger.info('device: ' + notification.device_token.to_s + ', device_type: ' + device_type.to_s + ', cert_env: ' + cert_env.to_s)
    end
    logger.close
  end

  def self.exe_query(sql)
    conn = connect_mysql
    result = conn.query(sql, symbolize_keys: true)
    conn&.close
    result
  end
end
