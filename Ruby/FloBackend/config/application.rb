require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module FLOLServer
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.2

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration can go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded after loading
    # the framework and any gems in your application.
    config.autoload_paths += %W(#{config.root}/lib/encode_decode_base64.rb)
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*'
        resource '*', :headers => :any, :methods => [:post, :put, :delete, :get, :options]
      end
    end

    if Rails.env.production?
      # Lograge config
      config.lograge.enabled = true

      # We are asking here to log in RAW (which are actually ruby hashes). The Ruby logging is going to take care of the JSON formatting.
      config.lograge.formatter = Lograge::Formatters::Raw.new

      # This is is useful if you want to log query parameters
      config.lograge.custom_options = lambda do |event|
        { :ddsource => ["ruby"],
          :params => event.payload[:params].reject { |k| %w(controller action).include? k }
        }
      end
    end
  end
end
