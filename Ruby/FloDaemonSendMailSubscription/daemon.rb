require 'rubygems'
require 'daemons'

pwd  = File.dirname(File.expand_path(__FILE__))
file = pwd + '/sendMail.rb'

Daemons.run_proc('send_mail_service',
                 log_output: true,
                 output_logfilename: 'send_mail_service.log',
                 logfilename: 'send_mail_service.log') do
  exec "ruby #{file}"
end
