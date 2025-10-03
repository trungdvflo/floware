require 'rubygems'
require 'daemons'

pwd  = File.dirname(File.expand_path(__FILE__))
file = pwd + '/DaemonDev_v1.6.rb'

Daemons.run_proc('send_silent_notification_service',
                 log_output: true,
                 output_logfilename: 'send_silent_notification_service.log',
                 logfilename: 'send_silent_notification_service.log') do
  exec "ruby #{file}"
end
