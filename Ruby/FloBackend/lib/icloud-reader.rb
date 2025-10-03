require 'nokogiri'
require 'httpclient'
require 'clamp'
require 'highline'

class ICloudReader
  PRINCIPAL_URL_XML = 
  %Q{<A:propfind xmlns:A='DAV:'>
    <A:prop>
    <A:current-user-principal/>
    </A:prop>
    </A:propfind>
  }
  
  CALENDARS_XML =
  %Q{  <A:propfind xmlns:A='DAV:'>
    <A:prop>
    <A:displayname/>
    </A:prop>
    </A:propfind>
  }    
  
  attr_reader :calendars, :user_id
  
  def initialize(options = {})
    @server_number = options[:server_number] || 1
    @client = HTTPClient.new
    @username = options[:username]
    @password = options[:password]
  end
  
  def base_calendars_url
    "https://p0#{@server_number}-caldav.icloud.com"
  end
  
  def base_contacts_url
    "https://p0#{@server_number}-contacts.icloud.com"
  end  
  
  def calendars_url
    URI.join(base_calendars_url, "#{user_id}/calendars/").to_s 
  end
  
  def contacts_url
    URI.join(base_contacts_url, "#{user_id}/carddavhome/card/").to_s
  end
  
  def load_user_id
    res = xml_request(base_calendars_url, PRINCIPAL_URL_XML)
    if res.code.to_i().between?(200, 299)
      document = ''
      begin
        errorhandling res
        document = Nokogiri::XML(res.body)
      rescue
      end
      user_id = document.search("current-user-principal href").first.text.split("/")[1]
      return [{ :success => { :code => res.code, :value => user_id}}]
    else
      return [{ :error => { :code => res.code, :message => res.content}}]
    end
  end
  def icloud_user_id_setting_account
    res = xml_request(base_calendars_url, PRINCIPAL_URL_XML)
    user_id = nil
    if res.code.to_i().between?(200, 299)
      document = ''
      begin
        errorhandling res
        document = Nokogiri::XML(res.body)
      rescue
      end
      user_id = document.search("current-user-principal href").first.text.split("/")[1]
    end
    user_id
  end
  
  private
  
  def xml_request(*args)
    return request(*args)
    # response = request(*args)
    # raise "Authentication failed! Check your username and password! #{response.code}" if response.code == 401    
    # raise "Invalid Response! I have no idea how to handle this... #{response.code}" unless response.code == 207
    # Nokogiri::XML(response.body) 
  end
  
  def request(url, xml)
    domain = url
    @client.set_auth(domain, @username, @password)
    result = @client.request("PROPFIND", url, nil, xml, headers)
    result
  end
  
  def headers
    {
      "Depth" => "0",
      "Content-Type" => "text/xml; charset='UTF-8'"
    }    
  end
  
  def  errorhandling response   
    raise AuthenticationError if response.code.to_i == 401
    raise NotExistError if response.code.to_i == 410 
    raise APIError if response.code.to_i >= 500
  end
  
end

class ICloudReaderCommand < Clamp::Command
  option ["-s", "--server-number"], "SERVER_NUMBER", "the number of the server to use", :default_value => "8"
  
  def reader
    unless @reader
      username = ask_for_username
      password = ask_for_password
      @reader = ICloudReader.new(:server_number => server_number, :username => username, :password => password)
    end
    @reader
  end
  
  def asker
    HighLine.new
  end
  
  def ask_for_username
    asker.ask("Username: ")
  end
  
  def ask_for_password
    asker.ask("Password (will be masked with x's): ")  { |q| q.echo = "x" }   
  end
  
  subcommand "calendars", "list the calendars and their URLs (as YAML)" do
    def execute
      # puts reader.calendars.to_yaml      
    end    
  end
  
  subcommand "contacts", "get your CardDAV url" do
    def execute
      # puts reader.contacts_url
    end    
  end
  
end