require 'rubygems'
require 'daemons'

pwd  = File.dirname(File.expand_path(__FILE__))
file = pwd + '/DaemonNoticeSubs.rb'

Daemons.run_proc('notification_subscription_service',
                 log_output: true,
                 output_logfilename: 'notification_subscription_service.log',
                 logfilename: 'notification_subscription_service.log') do
  exec "ruby #{file}"
end
