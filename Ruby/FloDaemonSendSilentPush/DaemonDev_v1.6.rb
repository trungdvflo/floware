require 'rufus-scheduler'
require 'date'
require 'houston'
require_relative './initializer/push_notification.rb'
require_relative './lib/pushmeup/apple'

def device_list(configs)
  interval = configs[:interval_stop_push] || 3600

  sql = " SELECT dv.*
          FROM device_token AS dv
          WHERE dv.status_app_run = 2 
          AND (dv.time_sent_silent - dv.time_received_silent <= " + interval.to_s + ")"

  devices = PushNotification.exe_query(sql)
  devices.to_a
end

# get config push silent
def config_option
  sql = 'SELECT cf.* FROM config_push_silent AS cf '
  result = PushNotification.exe_query(sql)
  result.first
end

# update time sent silent
def update_time(device_tokens)
  return if device_tokens.empty?
  sql = "UPDATE device_token
        SET time_sent_silent = " + Time.now.to_i.to_s + "
        where device_token IN (" + device_tokens + ")"
  PushNotification.exe_query(sql)
end

def self.logging_error(text_content)
  file_path  = File.join(File.dirname(__FILE__))
  file = File.open(file_path + '/error_invalid.log', File::WRONLY | File::APPEND | File::CREAT)
  logger = Logger.new file
  logger.datetime_format = '%Y-%m-%d %H:%M:%S'
  logger.error(text_content)
  logger.close
end

###################################################
def main
  configs = config_option
  devices = device_list(configs)

  return if devices.empty?

  devices_by_type = { '00': [],
                      '01': [],
                      '10': [],
                      '20': [],
                      '30': [],
                      '31': [],
                      '40': [],
                      '41': [] }

  devices.each do |dv|
    type_name = dv[:device_type].to_s + dv[:cert_env].to_s
    logging_error Environment.pem_env.keys.inspect
    logging_error type_name
    logging_error Environment.pem_env.keys.include? type_name
    if Environment.pem_env.keys.include? type_name
      next if devices_by_type[type_name.to_sym].nil?
      devices_by_type[type_name.to_sym] << dv
    else
      logging_error("device invalid: #{dv[:device_token]}")
    end
  end

  devices_by_type.keys.each do |key|
    send_silent_notification(devices_by_type[key], configs)
  end

  update_time(devices.map { |dv| "'" + dv[:device_token] + "'" }.join(','))
end

# send notification
def send_silent_notification(devices, configs)
  return if devices.empty?
  device_type = devices[0][:device_type].to_i
  cert_env = devices[0][:cert_env].to_i
  notifications = []

  devices.each do |dv|
    msg = ''
    sound = ''

    # just show for DEV and QC to testing
    if (dv[:env_silent].to_i != 0) and (configs[:has_alert].to_i != 0)        
      msg = configs[:show_alert] + "\n" + Time.now.to_s
      sound = configs[:show_sound]
    end

    notifications << APNS::Notification.new(dv[:device_token], alert: msg, sound: sound)          
  end
  PushNotification.push(device_type, cert_env, notifications) unless notifications.empty?
end

###################################################
scheduler = Rufus::Scheduler.new
scheduler.every '3m' do
  main
end
scheduler.join
