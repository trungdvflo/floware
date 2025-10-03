require 'silencer/logger'

FLOLServer::Application.configure do
  config.middleware.swap Rails::Rack::Logger, Silencer::Logger, :silence => ["/api/web/updateset"]
end