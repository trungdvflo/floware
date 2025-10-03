require 'socket'
require 'openssl'
require 'json'
require 'logger'

module APNS

  @host = 'gateway.sandbox.push.apple.com'
  @port = 2195
  # openssl pkcs12 -in mycert.p12 -out client-cert.pem -nodes -clcerts
  @pem = nil # this should be the path of the pem file not the contentes
  @pass = nil
  
  @persistent = false
  @mutex = Mutex.new
  @retries = 3 # TODO: check if we really need this
  
  @sock = nil
  @ssl = nil
  
  class << self
    attr_accessor :host, :pem, :port, :pass
  end
  
  def self.start_persistence
    @persistent = true
  end
  
  def self.stop_persistence
    @persistent = false
    
    @ssl.close
    @sock.close
  end

  def self.logging_error(text_content)
    file_path  = File.join(File.dirname(__FILE__))
    file = File.open(file_path + '/../../../error.log', File::WRONLY | File::APPEND | File::CREAT)
    logger = Logger.new file
    logger.datetime_format = '%Y-%m-%d %H:%M:%S'
    logger.error(text_content)
    logger.close
  end
  
  def self.send_notification(device_token, message)
    n = APNS::Notification.new(device_token, message)
    self.send_notifications([n])
  end
  
  def self.send_notifications(notifications)
    logging_error "path file pem: #{self.pem}"
    logging_error '-ENV-'
    logging_error "ENV['PEM_DIR']: #{ENV['PEM_DIR']}"
    logging_error "File.join(File.dirname(__FILE__), '../pems'): #{File.join(File.dirname(__FILE__), '../pems').to_s}"
    @mutex.synchronize do
      self.with_connection do
        notifications.each do |n|
          @ssl.write(n.packaged_notification)
        end
      end
    end
  end
  
  def self.feedback
    sock, ssl = self.feedback_connection

    apns_feedback = []

    while line = ssl.read(38)   # Read lines from the socket
      line.strip!
      f = line.unpack('N1n1H140')
      apns_feedback << { :timestamp => Time.at(f[0]), :token => f[2] }
    end

    ssl.close
    sock.close

    return apns_feedback
  end
  
protected
  
  def self.with_connection
    attempts = 1
  
    begin      
      logging_error 'pushmeup/apns/core.rb:'
      logging_error @ssl.inspect
      logging_error @sock.inspect
      logging_error '------'

      # If no @ssl is created or if @ssl is closed we need to start it
      if @ssl.nil? || @sock.nil? || @ssl.closed? || @sock.closed?
        @sock, @ssl = self.open_connection
      end
    
      yield
    
    rescue StandardError, Errno::EPIPE => ex
      raise unless attempts < @retries
    
      logging_error('Exception pushmeup/apns/core.rb:')
      logging_error(ex.message)
      logging_error(@ssl.inspect)
      logging_error(@sock.inspect)
      logging_error('------')
      @ssl.close
      @sock.close
    
      attempts += 1
      retry
    end
  
    # Only force close if not persistent
    unless @persistent
      @ssl.close
      @ssl = nil
      @sock.close
      @sock = nil
    end
  end
  
  def self.open_connection
    raise "The path to your pem file is not set. (APNS.pem = /path/to/cert.pem)" unless self.pem
    raise "The path to your pem file does not exist!" unless File.exist?(self.pem)
    
    context      = OpenSSL::SSL::SSLContext.new
    context.cert = OpenSSL::X509::Certificate.new(File.read(self.pem))
    context.key  = OpenSSL::PKey::RSA.new(File.read(self.pem), self.pass)

    sock         = TCPSocket.new(self.host, self.port)
    ssl          = OpenSSL::SSL::SSLSocket.new(sock,context)
    ssl.connect

    return sock, ssl
  end
  
  def self.feedback_connection
    raise "The path to your pem file is not set. (APNS.pem = /path/to/cert.pem)" unless self.pem
    raise "The path to your pem file does not exist!" unless File.exist?(self.pem)
    
    context      = OpenSSL::SSL::SSLContext.new
    context.cert = OpenSSL::X509::Certificate.new(File.read(self.pem))
    context.key  = OpenSSL::PKey::RSA.new(File.read(self.pem), self.pass)
    
    fhost = self.host.gsub('gateway','feedback')
    
    sock         = TCPSocket.new(fhost, 2196)
    ssl          = OpenSSL::SSL::SSLSocket.new(sock, context)
    ssl.connect

    return sock, ssl
  end
  
end
