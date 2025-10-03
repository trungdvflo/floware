module AgCalDAV
  class ICloudClient < Api::Web::BaseController
    CALDAV_NAMESPACE = "urn:ietf:params:xml:ns:caldav"
    TIME_FORMAT = '%Y%m%dT%H%M%SZ'
    include Icalendar
    attr_accessor :host, :port, :url, :user, :password, :ssl, :icloud_user_id

    def mparser=( mpr )
      @mparser = mpr
    end

    def mparser
      ManualParser::Parser.new
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
      @icloud_user_id = data[:icloud_user_id]
      @password = data[:password]
      @ssl      = uri.scheme == 'https'
      
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

    # use to find event data or todo dat of yahoo
    def find_event_todo(cal_uri, uuid, type)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Get.new("#{cal_uri}#{uuid}.ics")        
        if @authtype == 'basic'
          req.basic_auth @user, @password
        elsif @authtype == 'bearer'
          req['Authorization'] = "Bearer #{@token}"
        end
        res = http.request( req )
      }  
      errorhandling res
      begin
        calendar_data = res.body
        objs = Array.new
        item = {
          :id => -1,
          :calendarid => -1,
          :componenttype => type,
          :calendardata => calendar_data,
          :uri => cal_uri
        }
        objs << item
        # parse calendar data
        result = Api::Web::Utils.convert_calendar_obj(objs, true)
      rescue
      	false
      else
      	result[:data].first
      end
    end

    # VEVENT===============================================
    def find_event(cal_uri, uuid)
      find_event_todo(cal_uri, uuid, 'VEVENT')
    end

    # VTODO================================================
    def find_todo(cal_uri, uuid)
      find_event_todo(cal_uri, uuid, 'VTODO')
    end

    # get one calendar by cal_uri
    def get_icloud_calendar(cal_uri)
      res = nil
      __create_http.start {|http|
          req = Net::HTTP::Propfind.new(cal_uri, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
          if not @authtype == 'digest'
            req.basic_auth @user, @password
          else
            req.add_field 'Authorization', digestauth('PROPFIND')
          end
          req.body = '<?xml version="1.0" encoding="utf-8" ?>
          <d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:a="http://apple.com/ns/ical/">
            <d:prop>
              <d:current-user-principal/>
              <d:displayname />
              <d:resourcetype/>
              <d:supported-method-set/>
              <d:supported-report-set/>
              <c:supported-calendar-component-set/>
              <c:calendar-description/>
              <c:calendar-timezone/>
              <c:calendar-free-busy-set/>
              <cs:getctag/>
              <a:calendar-color/>
              <a:calendar-order/>
              <d:acl></d:acl>
              <d:current-user-privilege-set></d:current-user-privilege-set>
            </d:prop>
          </d:propfind>'
          res = http.request( req )
      }
      if res.code.to_i().between?(200, 299)
        result = []
        xml = REXML::Document.new( res.body )
        xml.elements.each('multistatus/response') do |elm|
          e = elm.elements
          next if e['href'].text.eql?(@url) || e['propstat/prop/displayname'].nil? 
          if e['propstat/prop/displayname'] && e['href'] then
            write_content = e['propstat/prop/current-user-privilege-set/privilege/write-content']
            if write_content.nil?
              is_read_only = true
            else
              is_read_only = false
            end
            
            item = { 'name' => e['propstat/prop/displayname'].text,
                    'href' => e['href'].text,
                    'color' => e['propstat/prop/calendar-color'].text,
                    'is_read_only' => is_read_only
                    }
            result << item
          end
        end
        result.first
      else
        return [{ :error => { :code => res.code, :message => res.message}}]
      end
    end
    
    def getlistcalendars
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
            req.body = '<?xml version="1.0" encoding="utf-8" ?>
            <d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:a="http://apple.com/ns/ical/">
              <d:prop>
                <d:current-user-principal/>
                <d:displayname />
                <d:resourcetype/>
                <d:supported-method-set/>
                <d:supported-report-set/>
                <c:supported-calendar-component-set/>
                <c:calendar-description/>
                <c:calendar-timezone/>
                <c:calendar-free-busy-set/>
                <cs:getctag/>
                <a:calendar-color/>
                <a:calendar-order/>
                <d:acl></d:acl>
                <d:current-user-privilege-set></d:current-user-privilege-set>
              </d:prop>
            </d:propfind>'
            #req.body = CalDAV::Request::ReportVEVENT.new( start, stop ).to_xml
            res = http.request( req )
        }
        
        if res.code.to_i().between?(200, 299)
          mparser.parse_calendar(res, 5, @icloud_user_id) # 5: ICLOUD_ACC_TYPE
        else
          return [{ :error => { :code => res.code, :message => res.message}}]
        end
    end
    
    def update_calendar(calendar_url = '', displayname = 'New Calendar', color = '', des = '')
      res = nil      
      des = '' if des == nil #check nil before save, allow description is blank      
        __create_http.start {|http|
            req = Net::HTTP::Proppatch.new(calendar_url, initheader = {'Content-Type'=>'application/xml'} )
            if @authtype == 'basic'
              req.basic_auth @user, @password
            elsif @authtype == 'bearer'
              req['Authorization'] = "Bearer #{@token}"
            else
              req.add_field 'Authorization', digestauth('PROPPATCH')
            end
            req.body = '<?xml version="1.0" encoding="utf-8" ?>
                   <D:propertyupdate xmlns:D="DAV:"
                   xmlns:Z="http://www.w3.com/standards/z39.50/" xmlns:a="http://apple.com/ns/ical/" xmlns:c="urn:ietf:params:xml:ns:caldav" >
                     <D:set>
                          <D:prop>
                            <D:displayname>'+displayname.to_s+'</D:displayname>
                            <a:calendar-color>'+color.to_s+'</a:calendar-color>
                            <c:calendar-description>'+des.to_s+'</c:calendar-description>
                          </D:prop>
                     </D:set>
                   </D:propertyupdate>'
            res = http.request( req )
        }
        if res.code.to_i.between?(200,299)
          return true
        else
          return false
        end
    end
    
    def delete_calendar(calendar_url)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Delete.new(calendar_url)
        if @authtype == 'basic'
          req.basic_auth @user, @password
        elsif @authtype == 'bearer'
          req['Authorization'] = "Bearer #{@token}"
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
    
    def report(calendar, objType, range)
        res = nil
        __create_http.start {|http|
            req = Net::HTTP::Report.new(calendar, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
            if @authtype == 'basic'
              req.basic_auth @user, @password
            elsif @authtype == 'bearer'
              req['Authorization'] = "Bearer #{@token}"
            else
              req.add_field 'Authorization', digestauth('REPORT')
            end
            if objType.eql?("VEVENT")
              req.body = AgCalDAV::Request::ReportICLOUDVEVENT.new('time-range', nil, range ).to_xml()
            elsif objType.eql?("VTODO")
              req.body = AgCalDAV::Request::ReportVTODO.new().to_xml()
            end
            res = http.request( req )
        }

       if res.code.to_i().between?(200, 299)
          mparser.parse_calendar_object(res, 5, nil) # 5: ICLOUD_ACC_TYPE
       else
          return [{ :error => { :code => res.code, :message => res.message}}]
       end
    end
    
    def update_calobj_by_ical_str(uuid, ical_str, cal_uri)
      res = nil    
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{cal_uri}#{uuid}.ics")
        req['Content-Type'] = 'text/calendar; charset=UTF-8'
        if @authtype == 'basic'
          req.basic_auth @user, @password
        elsif @authtype == 'bearer'
          req['Authorization'] = "Bearer #{@token}"
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = ical_str
        res = http.request( req )
      }
      errorhandling res
      # find_event uuid
      # accept any success code
      # if res.code.to_i.between?(200,299)
      #   return true
      # else
      #   return false
      # end

      if res.code.to_i().between?(200, 299)
        return [{:success => {:code => res.code, :message => res.message}}]
      else
        return [{:error => {:code => res.code, :message => res.message}}]
      end
    end
    
    def delete_calobj(uuid, cal_uri, href = nil)
      res = nil
      if href.nil?
        href = cal_uri + uuid + '.ics'
      end
      __create_http.start {|http|
        req = Net::HTTP::Delete.new(href)
        if @authtype == 'basic'
          req.basic_auth @user, @password
        elsif @authtype == 'bearer'
          req['Authorization'] = "Bearer #{@token}"
        else
          req.add_field 'Authorization', digestauth('DELETE')
        end
        res = http.request( req )
      }
      errorhandling res
      puts res.body
      puts res.message
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
    
    def bearerauth method
    
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


