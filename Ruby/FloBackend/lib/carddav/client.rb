module CardDav
  class Client
    CALDAV_NAMESPACE = "urn:ietf:params:xml:ns:carddav"
    TIME_FORMAT = '%Y%m%dT%H%M%SZ'
    attr_accessor :host, :port, :url, :user, :password, :ssl

    def format=( fmt )
      @format = fmt
    end

    def format
      @format ||= Format::Debug.new
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
      @url      = uri.path + data[:user] + '/'
      @user     = data[:user]
      @password = data[:password]
      @ssl      = uri.scheme == 'https'
      
      unless data[:authtype].nil?
      	@authtype = data[:authtype]
      	if @authtype == 'digest'
      	
      		@digest_auth = Net::HTTP::DigestAuth.new
      		@duri = URI.parse data[:uri]
      		@duri.user = @user
      		@duri.password = CGI.escape(@password.to_s) #@password
      		
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
    
    
    def propfind
        res = nil
        __create_http.start {|http|
            req = Net::HTTP::Propfind.new(@url, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
            if not @authtype == 'digest'
              req.basic_auth @user, @password
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

        xml = REXML::Document.new( res.body )
        result = Array.new
        xml.elements.each('d:multistatus/d:response') do |elm|
          e = elm.elements
          # next if e['d:href'].text.eql?(@url) || e['d:propstat/d:prop/d:displayname'].nil? 
          next if e['d:href'].text.eql?(@url) || e['d:propstat/d:prop/d:displayname'].text.nil?
          if e['d:propstat/d:prop/d:displayname'] && e['d:href'] then
            item = { 'name' => e['d:propstat/d:prop/d:displayname'].text,
                     'href' => e['d:href'].text}
            result << item
          end
        end
       return result
    end
    
    def report(address_book, ffield, fvalue, fmatch)
      filter = make_filter(ffield, fvalue, fmatch)    
      res = nil

      __create_http.start {|http|
          req = Net::HTTP::Report.new(address_book, initheader = {'Content-Type'=>'application/xml; charset=utf-8', 'Depth' => '1'} )
          if not @authtype == 'digest'
            req.basic_auth @user, @password
          else
            req.add_field 'Authorization', digestauth('REPORT')
          end
          
          if filter.present?
            req.body = '<card:addressbook-query xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
                          <d:prop>
                              <d:getetag />
                              <card:address-data />
                          </d:prop>
                          ' + filter +  
                        '</card:addressbook-query>'
          else
            req.body = '<card:addressbook-query xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
                        <d:prop>
                            <d:getetag />
                            <card:address-data />
                        </d:prop>
                    </card:addressbook-query>'
          end
          res = http.request( req )
      }

      contacts = []
      xml = REXML::Document.new(res.body)
      xml.elements.each('d:multistatus/d:response') do |elm|
        card_data = elm.elements["d:propstat/d:prop/card:address-data"].text
        card_href = elm.elements["d:href"].text

        vcards = Vpim::Vcard.decode(card_data)
        vcards.each do |card|
          vc = {
            'href' => card_href,
            'data' => card.to_s
          }
          contacts << vc
        end
      end 

      contacts
    end
    
    def report_contact_group(address_book)
      body_str = '<c:addressbook-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:carddav">
                    <d:prop>
                        <d:getetag />
                        <c:address-data />
                    </d:prop>
                    <c:filter>
                      <c:prop-filter name="X-ADDRESSBOOKSERVER-KIND"></c:prop-filter>
                    </c:filter>
                  </c:addressbook-query>'  
      res = nil

      __create_http.start {|http|
          req = Net::HTTP::Report.new(address_book, initheader = {'Content-Type'=>'application/xml; charset=utf-8', 'Depth' => '1'} )
          if not @authtype == 'digest'
            req.basic_auth @user, @password
          else
            req.add_field 'Authorization', digestauth('REPORT')
          end
          req.body = body_str
          res = http.request( req )
      }

      contacts = []
      xml = REXML::Document.new(res.body)
      xml.elements.each('d:multistatus/d:response') do |elm|
        card_data = elm.elements["d:propstat/d:prop/card:address-data"].text
        card_href = elm.elements["d:href"].text

        vcards = Vpim::Vcard.decode(card_data)
        vcards.each do |card|
          vc = {
            href: card_href,
            data: card.to_s
          }
          contacts << vc
        end
      end 

      contacts
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

    def errorhandling response   
      raise AuthenticationError if response.code.to_i == 401
      raise NotExistError if response.code.to_i == 410 
      raise APIError if response.code.to_i >= 500
    end

    # note: only `filter value` is required. `fname` default is `email`. `fmatch` default is `contains`
    def make_filter(ffield, fvalue, fmatch)
      filter = ''
      if !ffield then ffield = 'email' end
      if !fmatch then fmatch = 'contains' end
      if fvalue.present?
          filter = %{<card:filter test="anyof">
                      <card:prop-filter name="#{ffield.upcase.strip}">
                        <card:text-match collation="i;unicode-casemap" match-type="#{fmatch.strip}">#{fvalue.strip}</card:text-match>
                      </card:prop-filter>
                    </card:filter>
                    <card:limit>
                      <card:nresults>5</card:nresults>
                    </card:limit>\n}                       
      end
      filter
    end
  end

  class AgCalDAVError < StandardError
  end
  class AuthenticationError < AgCalDAVError; end
  class DuplicateError      < AgCalDAVError; end
  class APIError            < AgCalDAVError; end
  class NotExistError       < AgCalDAVError; end
end


