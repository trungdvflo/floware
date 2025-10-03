require 'net/https'
require 'net/http/digest_auth'
require 'uuid'
require 'rexml/document'
require 'rexml/xpath'
# require 'VCardigan'
# require 'Vpim'
require 'time'
require 'date'


['client.rb', 'icloud_client.rb', 'request.rb', 'net.rb', 'query.rb', 'filter.rb', 'format.rb'].each do |f|
    require File.join( File.dirname(__FILE__), 'carddav', f )
end