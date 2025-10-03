module CardDav
  class ICloudClient
    CALDAV_NAMESPACE = "urn:ietf:params:xml:ns:carddav"
    TIME_FORMAT = '%Y%m%dT%H%M%SZ'
    attr_accessor :host, :port, :url, :user, :password, :ssl, :num_of_report, :limit

    def format=( fmt )
      @format = fmt
    end

    def format
      @format ||= Format::Debug.new
    end
    
    def mparser=( mpr )
      @mparser = mpr
    end

    def mparser
      ManualParser::VcardParser.new
    end

    def initialize( data )
      unless data[:proxy_uri].nil?
        proxy_uri   = URI(data[:proxy_uri])
        @proxy_host = proxy_uri.host
        @proxy_port = proxy_uri.port.to_i
      end
      
      uri = URI(data[:uri])
      @host     = uri.host
      @port     = uri.port.to_i
      @url      = uri.path
      @user     = data[:user]
      @password = data[:password]
      @ssl      = uri.scheme == 'https'
      @num_of_report = 0
      unless data[:authtype].nil?
      	@authtype = data[:authtype]
      	if @authtype == 'digest'
      	
      		@digest_auth = Net::HTTP::DigestAuth.new
      		@duri = URI.parse data[:uri]
      		@duri.user = @user
      		@duri.password = @password
      		
      	elsif @authtype == 'basic'
	    	#Don't Raise or do anything else
	    else
	    	raise "Authentication Type Specified Is Not Valid. Please use basic or digest"
	    end
      else
      	@authtype = 'basic'
      end
    end

    def __create_http
      if @proxy_uri.nil?
        http = Net::HTTP.new(@host, @port)
      else
        http = Net::HTTP.new(@host, @port, @proxy_host, @proxy_port)
      end
      if @ssl
        http.use_ssl = @ssl
        http.verify_mode = OpenSSL::SSL::VERIFY_NONE
      end
      http
    end

    # find contact by cal_uri (href in contact)
    def find_contact(cal_uri, uuid)
      # format: /8368043433/carddavhome/card/4D9DB6B9-EE9C-42CF-B4E4-3A6E611A7B46.vcf
      href = cal_uri
      # if sync from apple device, cal_uri is only /8368043433/carddavhome/card/
      if !href.include? ".vcf"
        href = cal_uri + uuid + '.vcf/'
      end
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Get.new("#{href}")        
        if @authtype == 'basic'
          req.basic_auth @user, @password
        elsif @authtype == 'bearer'
          req['Authorization'] = "Bearer #{@token}"
        end
        res = http.request( req )
      } 
      errorhandling res
      card_data = res.body 
      vcard = Vpim::Vcard.decode(card_data).first
      #remove the photo
      ct_fields = vcard.fields.reject{ |f|
        f.name.eql?("PHOTO")
      }
      contact_str = ct_fields.join("\r\n")
      contact = {
        'href' => href ,
        'data' => contact_str,
        'type' => "VCARD"
      }
      contact   
    end
    
    def propfind
        res = nil
        __create_http.start {|http|
            req = Net::HTTP::Propfind.new(@url, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
            if @authtype == 'basic'
              req.basic_auth @user, @password
            elsif @authtype == 'bearer'
              req['Authorization'] = "Bearer #{@token}"
            else
              req.add_field 'Authorization', digestauth('PROPFIND')
            end
            req.body = '<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
                          <d:prop>
                             <d:displayname />
                             <cs:getctag />
                          </d:prop>
                        </d:propfind>'
            res = http.request( req )
        }
        
        if res.code.to_i().between?(200, 299)
          iCloudABParser(res) # 5: ICLOUD_ACC_TYPE
        else
          return [{ :error => { :code => res.code, :message => res.message}}]
        end
    end
    
    def iCloudABParser(res)
      xml = REXML::Document.new( res.body )
      result = Array.new
      xml.elements.each('multistatus/response') do |elm|
        e = elm.elements
        
        next if e['href'].nil? #|| e['href'].text.eql?(@url)
        
        item = {}
        item['href'] = e['href'].text
        
        result << item
      end
     return result
   end
    
   def report(address_book)
        cards = []
        res = nil
        __create_http.start {|http|
            req = Net::HTTP::Report.new(address_book, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
            if @authtype == 'basic'
              req.basic_auth @user, @password
            elsif @authtype == 'bearer'
              req['Authorization'] = "Bearer #{@token}"
            else
              req.add_field 'Authorization', digestauth('REPORT')
            end
            req.body = '<card:addressbook-query xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
                          <d:prop>
                              <d:getetag />
                              <card:address-data />
                          </d:prop>
                        </card:addressbook-query>'
            res = http.request( req )
        }        
        contacts = Array.new
        xml = REXML::Document.new(res.body)
        xml.elements.each('multistatus/response') do |elm|
          next if elm.nil?
          ad_data = elm.elements["propstat/prop/address-data"]
          next if ad_data.nil?
          card_data = ad_data.text
          next if card_data.nil?
          card_href = elm.elements["href"].text
          vcards = Vpim::Vcard.decode(card_data)
          vcards.each do |card|
            vc = {
              'href' => card_href,
              'data' => card.to_s
            }
            contacts << vc
          end
        end 
        
        return contacts  
    end

    def report_multiget(address_book, uris)
      cards = []
      res = nil
      __create_http.start {|http|
          req = Net::HTTP::Report.new(address_book, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
          if @authtype == 'basic'
            req.basic_auth @user, @password
          elsif @authtype == 'bearer'
            req['Authorization'] = "Bearer #{@token}"
          else
            req.add_field 'Authorization', digestauth('REPORT')
          end

          hrefTags = '';
          uris.each do |uri|
            tag = '<D:href>'+ uri +'</D:href>'
            hrefTags = hrefTags + tag
          end

          req.body = '<C:addressbook-multiget xmlns:D="DAV:"
                                xmlns:C="urn:ietf:params:xml:ns:carddav">
                        <D:prop>
                          <D:getetag/>
                          <C:address-data />
                        </D:prop>' + hrefTags + '</C:addressbook-multiget>'
          res = http.request( req )
      }
      contacts = Array.new
      xml = REXML::Document.new(res.body)
      xml.elements.each('multistatus/response') do |elm|
        next if elm.nil?
        ad_data = elm.elements["propstat/prop/address-data"]
        next if ad_data.nil?
        card_data = ad_data.text
        next if card_data.nil?
        card_href = elm.elements["href"].text
        vcards = Vpim::Vcard.decode(card_data)
        vcards.each do |card|
          vc = {
            'href' => card_href,
            'data' => card.to_s
          }
          contacts << vc
        end
      end 
      
      return contacts  
    end
    
    def create_contact(href, vcardStr)
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{href}")
        req['Content-Type'] = 'text/vcard; charset="utf-8"'
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = vcardStr
        res = http.request( req )
      }
      errorhandling res
      # find_event uuid
      # accept any success code
      if res.code.to_i.between?(200,299)
        return true
      else
        return false
      end
    end
    
    def delete_contact(href)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Delete.new("#{href}")
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('DELETE')
        end
        res = http.request( req )
      }
      errorhandling res
      # accept any success code
      if res.code.to_i.between?(200,299)
        return true
      else
        return false
      end
    end

  
    private
    def parseVcal( vcal )
        return_events = Array.new
        cals = Icalendar.parse(vcal)
        cals.each { |tcal|
            tcal.events.each { |tevent|
                if tevent.recurrence_id.to_s.empty? # skip recurring events
                    return_events << tevent
                end
            }
        }
        return return_events
    end
    
    def getField( name, l )
        fname = (name[-1] == ':'[0]) ? name[0..-2] : name 
        return NIL unless l.index(fname)
        idx = l.index( ":", l.index(fname))
        return l[ idx+1..-1 ] 
    end
    
    def digestauth method
		
	    h = Net::HTTP.new @duri.host, @duri.port
	    if @ssl
	    	h.use_ssl = @ssl
	    	h.verify_mode = OpenSSL::SSL::VERIFY_NONE
	    end
	    req = Net::HTTP::Get.new @duri.request_uri
	    
	    res = h.request req
	    # res is a 401 response with a WWW-Authenticate header
	    
	    auth = @digest_auth.auth_header @duri, res['www-authenticate'], method
	    
    	return auth
    end
    
    def entry_with_uuid_exists? uuid
      res = nil
      
      __create_http.start {|http|
        req = Net::HTTP::Get.new("#{@url}/#{uuid}.ics")
        if not @authtype == 'digest'
        	req.basic_auth @user, @password
        else
        	req.add_field 'Authorization', digestauth('GET')
        end
        
        res = http.request( req )
      	
      }
      begin
        errorhandling res
      	Icalendar.parse(res.body)
      rescue
      	return false
      else
      	return true
      end
    end
    def  errorhandling response   
      raise AuthenticationError if response.code.to_i == 401
      raise NotExistError if response.code.to_i == 410 
      raise APIError if response.code.to_i >= 500
    end
  end


  class AgCalDAVError < StandardError
  end
  class AuthenticationError < AgCalDAVError; end
  class DuplicateError      < AgCalDAVError; end
  class APIError            < AgCalDAVError; end
  class NotExistError       < AgCalDAVError; end
end


