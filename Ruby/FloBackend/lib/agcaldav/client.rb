module AgCalDAV
  class Client
    require 'cgi'
    require 'icalendar/tzinfo'
    require 'tzinfo'

    CALDAV_NAMESPACE = "urn:ietf:params:xml:ns:caldav"
    TIME_FORMAT = '%Y%m%dT%H%M%SZ'
    include Icalendar
    attr_accessor :host, :port, :url, :user, :password, :ssl

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
      		@duri.password = CGI.escape(@password.to_s)
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
    
    def create_calendar(calendarURL, display_name, description, calendar_time_zone, color)
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Mkcalendar.new(@url+"#{calendarURL}", initheader = {'Content-Type'=>'application/xml; charset="utf-8"'})
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('MKCALENDAR')
        end
        req.body = AgCalDAV::Request::Mkcalendar.new(display_name,description,calendar_time_zone, color).to_xml
        res = http.request( req )
      }
    end
    
    def create_calendars(calendars)
      res = []
      __create_http.start { |http|
        calendars.each do |calendar|
          calendarURL = calendar[:calendarURL]
          req = Net::HTTP::Mkcalendar.new(URI.encode(@url+"#{calendarURL}"), initheader = {'Content-Type'=>'application/xml; charset="utf-8"'})
          if not @authtype == 'digest'
            req.basic_auth @user, @password
          else
            req.add_field 'Authorization', digestauth('MKCALENDAR')
          end
          req.body = AgCalDAV::Request::Mkcalendar.new(calendar[:display_name], calendar[:description], calendar[:calendar_time_zone], calendar[:color]).to_xml
          res << http.request( req )
        end
      }
    end
    
    def create_calendar_mkcol(display_name, description)
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Mkcol.new(@url, initheader = {'Content-Type'=>'text/xml; charset="utf-8"'})
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('MKCOL')
        end
        req.body = AgCalDAV::Request::Mkcol.new(display_name,description).to_xml
        res = http.request( req )
      }
      errorhandling res
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
            req.body = '<?xml version="1.0" encoding="utf-8" ?><d:propfind xmlns:d="DAV:" xmlns:c="http://calendarserver.org/ns/"><d:prop><d:principal-collection-set/><d:current-user-principal/><d:calendar-description xmlns="urn:ietf:params:xml:ns:caldav" /></d:prop></d:propfind>'
            res = http.request( req )
        }
        format.parse_calendar( res.body )
    end
    
    def update_calendar_color(calendar_url, color)
      url = @url + calendar_url
      res = nil
        __create_http.start {|http|
            req = Net::HTTP::Proppatch.new(url, initheader = {'Content-Type'=>'application/xml'} )
            if not @authtype == 'digest'
              req.basic_auth @user, @password
            else
              req.add_field 'Authorization', digestauth('PROPPATCH')
            end
            req.body = '<?xml version="1.0" encoding="utf-8" ?>
                   <D:propertyupdate xmlns:D="DAV:"
                   xmlns:Z="http://www.w3.com/standards/z39.50/" xmlns:a="http://apple.com/ns/ical/">
                     <D:set>
                          <D:prop>
                            <a:calendar-color>'+color+'</a:calendar-color>
                          </D:prop>
                     </D:set>
                   </D:propertyupdate>'
            res = http.request( req )
        }
        format.parse_calendar( res.body )
    end
    
    def update_calendar(calendar_url = '', displayname = 'New Calendar', color = '', des = '')
      url = @url + calendar_url
      res = nil      
      des = '' if des == nil #check nil before save, allow description is blank      
        __create_http.start {|http|
            req = Net::HTTP::Proppatch.new(url, initheader = {'Content-Type'=>'application/xml'} )
            if not @authtype == 'digest'
              req.basic_auth @user, @password
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
    
    #NEED TO FIX
    def show_hide_calendar(calendar_url = '', invisible = true)
      url = @url + calendar_url
      res = nil      
      des = '' if des == nil #check nil before save, allow description is blank      
        __create_http.start {|http|
            req = Net::HTTP::Proppatch.new(url, initheader = {'Content-Type'=>'application/xml'} )
            if not @authtype == 'digest'
              req.basic_auth @user, @password
            else
              req.add_field 'Authorization', digestauth('PROPPATCH')
            end
            req.body = '<?xml version="1.0" encoding="utf-8" ?>
                   <D:propertyupdate xmlns:D="DAV:"
                   xmlns:Z="http://www.w3.com/standards/z39.50/" xmlns:a="http://apple.com/ns/ical/" xmlns:c="urn:ietf:params:xml:ns:caldav" >
                     <D:set>
                          <D:prop>
                            <D:invisible>'+invisible+'</D:invisible>
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
    
    def getlistcalendars
      res = nil
      __create_http.start {|http|
          req = Net::HTTP::Propfind.new(@url, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
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
            </d:prop>
          </d:propfind>'
          #req.body = CalDAV::Request::ReportVEVENT.new( start, stop ).to_xml
          res = http.request( req )
      }
      xml = REXML::Document.new( res.body )
      result = Array.new
      xml.elements.each('d:multistatus/d:response') do |elm|
        e = elm.elements
        next if e['d:href'].text.eql?(@url) || e['d:propstat/d:prop/d:displayname'].nil? 
        if e['d:propstat/d:prop/d:displayname'] && e['d:href'] then
          item = { 'name' => e['d:propstat/d:prop/d:displayname'].text,
                    'href' => e['d:href'].text,
                    'color' => e['d:propstat/d:prop/x4:calendar-color'].text }
          result << item
        end
      end
      return result
    end
    
    def calendars
      dings = """<?xml version='1.0'?>
              <d:propfind xmlns:d='DAV:' xmlns:c='#{CALDAV_NAMESPACE}'>
              <d:prop>
              <c:calendar-free-busy-set/>
              <d:displayname/>
              <d:resourcetype/>
              </d:prop>
              </d:propfind>
              """
      res = nil
      Net::HTTP.start(@host, @port) do | http |
          req = Net::HTTP::Propfind.new(@url, initheader = {'Content-Type'=>'application/xml'} )
          if not @authtype == 'digest'
            req.basic_auth @user, @password
          else
            req.add_field 'Authorization', digestauth('PROPFIND')
          end
          req['DEPTH'] = 1
          req.body = dings
          res = http.request( req )
      end
      result = CalendarsCollection.new
      xml = REXML::Document.new( res.body )
      REXML::XPath.each( xml, "//[*/*/*/cal:calendar]", {'cal' => CALDAV_NAMESPACE} ) do | c |
        href = c.elements['href'].text
        display_name = c.elements['propstat/prop/displayname'].text
        calendar = Calendar.new
        calendar.path = href
        calendar.name = display_name
        result << calendar
      end
      result
    end
    
    def getacalendar(calendar = '')
      url = @url+calendar.to_s
        res = nil
        __create_http.start {|http|
            req = Net::HTTP::Propfind.new(url, initheader = {'Content-Type'=>'application/xml', 'Depth' => '2'} )
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
              </d:prop>
            </d:propfind>'
            res = http.request( req )
        }
        return res.body
    end
    
    def report(calendar, component_type, range)#calendarname, start, stop )
        res = nil
        __create_http.start {|http|
            req = Net::HTTP::Report.new(@url + calendar, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
            if not @authtype == 'digest'
              req.basic_auth @user, @password
            else
              req.add_field 'Authorization', digestauth('REPORT')
            end
            req.body = AgCalDAV::Request::ReportFloVEVENT.new( 'time-range', nil, range ).to_xml
            res = http.request( req )
        }
        
        if res.code.to_i().between?(200, 299)
          mparser.parse_calendar_object(res, 0, calendar)
        else
          return [{ :error => { :code => res.code, :message => res.message}}]
        end
    end

    def check_change_calendar(calendar, component_type, range)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Report.new(@url + calendar, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
        # req = Net::HTTP::Report.new(@url, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('REPORT')
        end
        req.body =
        if component_type == API_VTODO
          '<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
            <d:prop>
                <d:getetag />
            </d:prop>
            <c:filter>
                <c:comp-filter name="VCALENDAR">
                    <c:comp-filter name="VTODO" />
                </c:comp-filter>
            </c:filter>
          </c:calendar-query>'
        elsif component_type == API_VJOURNAL
          '<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
            <d:prop>
                <d:getetag />
            </d:prop>
            <c:filter>
                <c:comp-filter name="VCALENDAR">
                  <c:comp-filter name="VJOURNAL" />
                </c:comp-filter>
            </c:filter>
          </c:calendar-query>'
        elsif component_type == API_VEVENT
          '<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
            <d:prop>
                <d:getetag />
            </d:prop>
            <c:filter>
                <c:comp-filter name="VCALENDAR">
                  <c:comp-filter name="VEVENT" />
                </c:comp-filter>
            </c:filter>
          </c:calendar-query>'
        end
        # puts "-----------".red
        # puts req.body
        res = http.request( req )
      }

      if res.code.to_i().between?(200, 299)
        # mparser.parse_calendar_object(res, 0, calendar)

        uris_change = []
        xml_changes = REXML::Document.new(res.body)
        xml_changes.elements.each('d:multistatus/d:response') do |elm|
          e = elm.elements
          # uris_change << e["d:href"].text
          uris_change << e["d:href"].to_s
        end

        return "" unless uris_change.present?

        items = []
        res_change = ""
        __create_http.start {|http|
          req = Net::HTTP::Report.new(@url + calendar, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
          # req = Net::HTTP::Report.new(@url, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
          if not @authtype == 'digest'
            req.basic_auth @user, @password
          else
            req.add_field 'Authorization', digestauth('REPORT')
          end
          req.body =
            '<c:calendar-multiget xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
              <d:prop>
                  <d:getetag />
                  <c:calendar-data />
              </d:prop>
              ' + uris_change.join("\n") +'
            </c:calendar-multiget>'
          res_change = http.request( req )
          # calendar = Icalendar::Parser.new(res_change.body).parse.first
          xml = REXML::Document.new(res_change.body)
          xml.elements.each('d:multistatus/d:response') do |elm|
            e = elm.elements
            # begin
            calendar = Icalendar::Parser.new(e["d:propstat/d:prop/cal:calendar-data"].text).parse.first
            # events
            calendar.events.each do |ev|
              calobj = convertToItem(ev, API_VEVENT)
              items << calobj
            end
            # todos
            calendar.todos.each do |ev|
              calobj = convertToItem(ev, API_VTODO)
              items << calobj
            end
            # journals
            calendar.journals.each do |ev|
              calobj = convertToItem(ev, API_VJOURNAL)
              items << calobj
            end
            # rescue
            # end
          end
        }

        return items
      else
        return [{ :error => { :code => res.code, :message => res.message}}]
      end
    end

    def get_all_items_by_cal(cal_uri)
      res = nil
      __create_http.start {|http|
          req = Net::HTTP::Report.new(@url + cal_uri, initheader = {'Content-Type'=>'application/xml'} )
          if not @authtype == 'digest'
            req.basic_auth @user, @password
          else
            req.add_field 'Authorization', digestauth('REPORT')
          end
          req.body = AgCalDAV::Request::ReportAllItem.new.to_xml            
          res = http.request( req )
      }       
      items = []
      
      xml = REXML::Document.new(res.body)
        xml.elements.each('d:multistatus/d:response') do |elm|
          e = elm.elements
          # begin
            calendar = Icalendar::Parser.new(e["d:propstat/d:prop/cal:calendar-data"].text).parse.first            
            # events
            calendar.events.each do |ev|              
              calobj = convertToItem(ev, API_VEVENT)
              items << calobj
            end
            # todos
            calendar.todos.each do |ev|              
              calobj = convertToItem(ev, API_VTODO)
              items << calobj
            end
            # journals
            calendar.journals.each do |ev|              
              calobj = convertToItem(ev, API_VJOURNAL)
              items << calobj
            end
          # rescue
          # end
        end

      return items       
    end

    # get all items by folder id
    def get_all_calobjs_by_folderid(cal_uri, folderid)      
      res = nil
      __create_http.start {|http|
          req = Net::HTTP::Report.new(@url + cal_uri, initheader = {'Content-Type'=>'application/xml'} )
          if not @authtype == 'digest'
            req.basic_auth @user, @password
          else
            req.add_field 'Authorization', digestauth('REPORT')
          end
          req.body = AgCalDAV::Request::ReportAllItem.new('folderid', folderid).get_calobjs_by_folderid
          res = http.request(req)
      }       
      items = []
      
      xml = REXML::Document.new(res.body)
        xml.elements.each('d:multistatus/d:response') do |elm|
          e = elm.elements
          # begin
            calendar = Icalendar::Parser.new(e["d:propstat/d:prop/cal:calendar-data"].text).parse.first                 
            # events
            calendar.events.each do |ev|              
              calobj = convertToItem(ev, API_VEVENT)
              items << calobj
            end
            # todos
            calendar.todos.each do |ev|              
              calobj = convertToItem(ev, API_VTODO)
              items << calobj
            end
            # journals
            calendar.journals.each do |ev|              
              calobj = convertToItem(ev, API_VJOURNAL)
              items << calobj
            end
          # rescue
          # end
        end             
      return items       
    end

    def find_events_by_date(calendar, range, tstart, tend)
      res = nil
      __create_http.start {|http|
          req = Net::HTTP::Report.new(calendar, initheader = {'Content-Type'=>'application/xml'} )
          if not @authtype == 'digest'
            req.basic_auth @user, @password
          else
            req.add_field 'Authorization', digestauth('REPORT')
          end
          req.body = AgCalDAV::Request::ReportFloVEVENT.new('time-range', nil, range, tstart, tend).to_xml
                 
          res = http.request( req )
      }
      events = []      
      xml = REXML::Document.new(res.body)
      xml.elements.each('d:multistatus/d:response') do |elm|
        e = elm.elements
        calendar = Icalendar::Parser.new(e["d:propstat/d:prop/cal:calendar-data"].text).parse.first
        calendar.events.each do |event|          
          e = {
            'calendar_object' => event.to_ical()
          }
          events << e
        end  
      end 
      return events       
    end
    
   def find_events (calendar,data)
      url = @url+calendar.to_s
      result = ""
      events = Array.new
      res = nil
      __create_http.start {|http|       
        req = Net::HTTP::Report.new(url, initheader = {'Content-Type'=>'application/xml'} )
        if not @authtype == 'digest'
         req.basic_auth @user, @password
        else
         req.add_field 'Authorization', digestauth('REPORT')
        end      
        # puts data.to_json      
        if data[:start].is_a? Integer

          req.body = AgCalDAV::Request::ReportFloVEVENT.new('time-range',nil,nil,Time.at(data[:start]).utc.strftime("%Y%m%dT%H%M%S"), 
                                                        Time.at(data[:end]).utc.strftime("%Y%m%dT%H%M%S") ).to_xml          
        else
          req.body = AgCalDAV::Request::ReportFloVEVENT.new('time-range',nil,nil,DateTime.parse(data[:start]).utc.strftime("%Y%m%dT%H%M%S"), 
                                                        DateTime.parse(data[:end]).utc.strftime("%Y%m%dT%H%M%S") ).to_xml
        end
        res = http.request(req)
      } 
      errorhandling res
      
      xml = REXML::Document.new(res.body)
        xml.elements.each('d:multistatus/d:response') do |elm|
          e = elm.elements
          # begin
            calendar = Icalendar::Parser.new(e["d:propstat/d:prop/cal:calendar-data"].text).parse.first
            # puts calendar
            calendar.events.each do |ev|
              
              
              calobj = {
                 # 'color' => ev.calendarcolor ? ev.calendarcolor : '',
                 # 'cal_uri' => calendar ? calendar : '',
                 'uid' => ev.uid ? ev.uid : '',
                 'folderid' => ev.folderid ? ev.folderid[0] : '',
                 'summary' => ev.summary ? ev.summary : '',
                 'url' => ev.url ? ev.url : '',
                 'location' => ev.location ? ev.location : '',
                 'description' => (ev.description and ev.description[0]) ? ev.description[0] : '',
                 # 'notecontent' => ev.notecontent ? ev.notecontent[0] : '',
                 'color' => ev.color ? ev.color[0] : '',
                 'dtstamp' => ev.dtstamp ? ev.dtstamp : '',
                 'dtstart' => ev.dtstart ? ev.dtstart : '',
                 'dtend' => ev.dtend ? ev.dtend : '',
                 'star' => ev.star ? ev.star[0] : '',
                 # 'subtasks' => ev.subtasks ? ev.subtasks[0] : '',
                 # 'taskduration' => ev.taskduration ? ev.taskduration[0] : '',
                 # 'due' => ev.due ? ev.due[0] : '',
                 # 'stask' => ev.stask ? ev.stask : '',
                 # 'status' => ev.status ? ev.status : '',
                 'rrule' => ev.rrule ? ev.rrule[0] : '',
                 'attendee' => ev.attendee ? ev.attendee : '',
                 # 'organizer' => ev.organizer ? ev.organizer : '',
                 # 'categories' => ev.categories ? ev.categories[0] : '',                 
                 'sequence' => ev.sequence ? ev.sequence : 0 ,
                 'created' => ev.created ? ev.created : ''             
              }
              
              events << calobj      
            end
        end  
        return events
    end

    def find_event (calendar, uuid, type)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Get.new("#{@url}#{calendar}/#{uuid}.ics")        
        if not @authtype == 'digest'
        	req.basic_auth @user, @password
        else
        	req.add_field 'Authorization', digestauth('GET')
        end
        res = http.request( req )
      }  
      errorhandling res
      begin
        calendar_data = res.body
        objs = Array.new
        item = {
          :componenttype => type,
          :calendardata => calendar_data,
          :uri => calendar
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

    def delete_calendar(calendar)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Delete.new("#{@url}#{calendar}")
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

    def delete_event(uuid,calendar)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Delete.new("#{@url}#{calendar}/#{uuid}.ics")
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

    def delete_calendar_object(uuid,calendar)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Delete.new("#{@url}#{calendar}/#{uuid}.ics")
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

    def create_event(event,calendar)
      c = Icalendar::Calendar.new
      uuid = UUID.new.generate
      uuid = event[:uuid] if event[:uuid]
      raise DuplicateError if entry_with_uuid_exists?(uuid)
      
      #set timezone for event 
      tz = (event[:timezone] and event[:timezone].to_s.strip.length > 0) ? event[:timezone] : "America/Chicago"
      # if tz and tz.to_s.strip.length > 0
        # Time.now.in_time_zone(tz)
        # tz = "America/Chicago"
      # end
      
      e = Icalendar::Event.new
      e.uid           = uuid 
      # e.dtstart       = DateTime.parse(event[:start])
      # e.dtend         = DateTime.parse(event[:end])
      e.dtstart = Icalendar::Values::DateTime.new DateTime.parse(event[:start]), 'tzid' => tz
      e.dtend   = Icalendar::Values::DateTime.new DateTime.parse(event[:end]), 'tzid' => tz

      
      #e.categories    = event[:categories]# Array
      #e.contact       = event[:contact] # Array
      #e.attendee      = event[:attendee]# Array
      # e.duration      = event[:duration]
      e.summary       = event[:title]
      e.description   = event[:description]
      #e.ip_class      = event[:accessibility] #PUBLIC, PRIVATE, CONFIDENTIAL
      e.location      = event[:location] if event[:location]
      #e.geo           = event[:geo]
      #e.status        = event[:status]
      e.url           = event[:url]
      e.x_lcl_folderid       = event[:folderid] if event[:folderid]
      e.x_lcl_color       = event[:color] if event[:color]
      # e.x_lcl_subtasks = ''
      # e.subtasks = event[:subtasks]
      
      #Add Event object to calendar
      c.add_event(e)
      cstring = c.to_ical
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{@url}#{calendar}/#{uuid}.ics")
        req['Content-Type'] = 'text/calendar'
        if not @authtype == 'digest'
        	req.basic_auth @user, @password
        else
        	req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = cstring
        res = http.request( req )
      }
    end
    
    def new_event_string (event)
      c = Icalendar::Calendar.new
      uuid = UUID.new.generate
      uuid = event[:uuid] if event[:uuid]
      #raise DuplicateError if entry_with_uuid_exists?(uuid)
      
      #set timezone for event 
      tz = (event[:timezone] and event[:timezone].to_s.strip.length > 0) ? event[:timezone] : "America/Chicago"
      # if tz and tz.to_s.strip.length > 0
        # Time.now.in_time_zone(tz)
        # tz = "America/Chicago"
      # end
      
      e = Icalendar::Event.new
      e.uid           = uuid 
      # e.dtstart       = DateTime.parse(event[:start])
      # e.dtend         = DateTime.parse(event[:end])
      e.dtstart = Icalendar::Values::DateTime.new DateTime.parse(event[:start]), 'tzid' => tz
      e.dtstart = e.dtstart.strftime("%Y%m%dT%H%M%S")
      e.dtend   = Icalendar::Values::DateTime.new DateTime.parse(event[:end]), 'tzid' => tz
      e.dtend = e.dtend.strftime("%Y%m%dT%H%M%S")
      
      #e.categories    = event[:categories]# Array
      #e.contact       = event[:contact] # Array
      #e.attendee      = event[:attendee]# Array
      # e.duration      = event[:duration]
      e.summary       = event[:title]
      e.description   = event[:description]
      #e.ip_class      = event[:accessibility] #PUBLIC, PRIVATE, CONFIDENTIAL
      e.location      = event[:location] if event[:location]
      #e.geo           = event[:geo]
      #e.status        = event[:status]
      e.url           = event[:url]
      e.x_lcl_folderid       = event[:folderid] if event[:folderid]
      e.x_lcl_color       = event[:color] if event[:color]
      # e.x_lcl_subtasks = ''
      # e.subtasks = event[:subtasks]
      
      #Add Event object to calendar
      c.add_event(e)
      cstring = c.to_ical
      return cstring
    end
    
    def create_events(events, calendar)
      res = []
      
      #http = Net::HTTP.new(@host, @port)
      __create_http.start { |http|
        events.each do |event|
            uuid = event[:uuid].to_str
            uri = "#{@url}#{calendar}/#{uuid}.ics"
            req = Net::HTTP::Put.new(uri)
            req['Content-Type'] = 'text/calendar'
            if not @authtype == 'digest'
              req.basic_auth @user, @password
            else
              req.add_field 'Authorization', digestauth('PUT')
            end
            req.body = new_event_string(event)
            res << http.request( req )
        end
      }
    end

    # create calendar object
    def create_calobj_by_ical(uuid, cal_obj_data, calendar)
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{@url}#{calendar}/#{uuid}.ics")
        req['Content-Type'] = 'text/calendar; charset=UTF-8'
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = cal_obj_data     
        res = http.request(req)
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

    def find_calendar_objects(calendar, summary)
        res = nil
        __create_http.start {|http|
            req = Net::HTTP::Report.new(@url + calendar.to_s, initheader = {'Content-Type'=>'application/xml', 'Depth' => '1'} )
            if not @authtype == 'digest'
              req.basic_auth @user, @password
            else
              req.add_field 'Authorization', digestauth('REPORT')
            end
            req.body = AgCalDAV::Request::ReportFloVEVENT.new('folderid',summary).to_xml
            res = http.request( req )
        }
        
        arrCalObjs = []

        xml = REXML::Document.new(res.body)
        xml.elements.each('d:multistatus/d:response') do |elm|
          e = elm.elements
          begin
            calendar = Icalendar::Parser.new(e["d:propstat/d:prop/cal:calendar-data"].text).parse.first
            calendar.events.each do |event|
              e = {
                'calendar_object' => event.to_ical()
              }
              arrCalObjs << e
                            
            end
            # todos
            calendar.todos.each do |todo|              
              td = {
                'calendar_object' => todo.to_ical()
              }
              arrCalObjs << td
            end
          rescue
          end
        end
       return arrCalObjs
    end
    # =========================== end Cong.Tran =========
    
    def update_event(event,calendarname)
      c = Icalendar::Calendar.new
      uuid = event[:uid]
      #raise DuplicateError if entry_with_uuid_exists?(uuid)
      c.event do |e|
        e.uid = uuid
        e.dtstart     = DateTime.parse(event[:start])
        e.dtend       = DateTime.parse(event[:end])
        e.summary     = event[:title]
        e.description = event[:description]
      end
      
      cstring = c.to_ical
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{@url}#{calendarname}/#{uuid}.ics", initheader = {'Content-Type'=>'text/calendar', 'dataType' => 'xml'})
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = cstring
        res = http.request( req )
      }
      errorhandling res
    end
    
    def update_event_by_strIcalEvent(uuid, cal_obj_data,calendarname)
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{@url}#{calendarname}/#{uuid}.ics", initheader = {'Content-Type'=>'text/calendar', 'dataType' => 'xml'})
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = cal_obj_data
        res = http.request( req )
      }
      errorhandling res
      if res.code.to_i.between?(200,299)
        return true
      else
        return false
      end
    end

    def add_alarm tevent, altCal="Calendar"
      dtstart_string = ( Time.parse(tevent.dtstart.to_s) + Time.now.utc_offset.to_i.abs ).strftime "%Y%m%dT%H%M%S"
      dtend_string = ( Time.parse(tevent.dtend.to_s) + Time.now.utc_offset.to_i.abs ).strftime "%Y%m%dT%H%M%S"

      tcal = Calendar.new
      tevent.summary << " [added to noctane]"
      tevent.alarm do
      action        "EMAIL"
      description   tevent.description
      summary       tevent.summary
      add_attendee  "mailto:support@noctane.contegix.com"
      trigger       "-PT5M"
      end
      tcal.add_event tevent
      res = nil
      thttp = Net::HTTP.start(@host, @port)
      req = Net::HTTP::Put.new("#{@url}/#{tevent.uid}.ics", initheader = {'Content-Type'=>'text/calendar'} )
      req.basic_auth @user, @password
      req.body = tcal.to_ical
      res = thttp.request( req )
      return tevent.uid
    end

    def find_todo uuid
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
      errorhandling res
      r = Icalendar.parse(res.body)
      r.first.todos.first
    end


    # VJOURNAL ======================================================
    def create_journal(note,calendar)
      c = Icalendar::Calendar.new
      uuid = UUID.new.generate
      raise DuplicateError if entry_with_uuid_exists?(uuid)
      e = Icalendar::Journal.new
      e.uid           = uuid 
      e.dtstart       = DateTime.parse(note[:dtstart]) if note[:dtstart]
      #e.categories    = event[:categories]# Array
      #e.contact       = event[:contact] # Array
      #e.attendee      = event[:attendee]# Array
      e.summary       = note[:summary] if note[:summary]
      e.x_lcl_folderid       = note[:folderid] if note[:folderid]
      e.description   = note[:description] if note[:description]
      e.x_lcl_notecontent   = note[:notecontent] if note[:notecontent] 
      #e.ip_class      = event[:accessibility] #PUBLIC, PRIVATE, CONFIDENTIAL
      #e.geo           = event[:geo]
      #e.status        = event[:status]
      # e.url           = event[:url]
      #e.subtasks   = "[{'id':'01','title':'subtask01','checked':true},{'id':'02','title':'subtask02','checked':true},{'id':'03','title':'subtask03','checked':true}]"
      
      #Add Event object to calendar
      c.add_journal(e)
      cstring = c.to_ical
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{@url}#{calendar}/#{uuid}.ics")
        req['Content-Type'] = 'text/calendar'
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = cstring
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
    
    def create_a_vjournal_by_strIcalEvent(uuid, cal_obj_data,calendar)
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{@url}#{calendar}/#{uuid}.ics")
        req['Content-Type'] = 'text/calendar'
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = cal_obj_data
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
    
    def find_journal(calendar, uuid)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Get.new("#{@url}#{calendar}/#{uuid}.ics")        
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('GET')
        end
        res = http.request( req )
      }  
      errorhandling res
      #return res.body
      begin
        r = Icalendar.parse(res.body)
      rescue
        return false
      else
        r.first.journals.first 
      end      
    end
    
    def find_todo (calendar,uuid)
      res = nil
      __create_http.start {|http|
        req = Net::HTTP::Get.new("#{@url}#{calendar}/#{uuid}.ics")
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('GET')
        end
        res = http.request( req )
      }  
      
      errorhandling res
      #return res.body
      begin
        r = Icalendar.parse(res.body)
      rescue
        return false
      else
        r.first.todos.first 
      end
    end
        
    def create_todo(todo, calendar)
      c = Icalendar::Calendar.new
      uuid = todo[:uuid] #? todo[:uuid] : UUID.new.generate
      # raise DuplicateError if entry_with_uuid_exists?(uuid)
      # t = Icalendar::Todo.new
      t = Icalendar::Todo.new
      t.uid           = uuid 
      t.dtstart       = DateTime.parse(todo[:start]) if todo[:start]
      t.duration      = todo[:duration] if todo[:duration]
      t.summary       = todo[:summary] if todo[:summary]
      t.description   = todo[:description] if todo[:description]
      t.location      = todo[:location] if todo[:location]
      t.percent_complete= todo[:percent_complete] if todo[:percent_complete]
      t.priority      = todo[:priority] if todo[:priority]
      t.geo           = todo[:geo] if todo[:geo]
      t.status        = todo[:status] if todo[:status]
      t.url           = todo[:url] if todo[:url]
      t.x_lcl_folderid       = todo[:folderid] if todo[:folderid]
      
      
      #Add Event object to calendar
      c.add_todo(t)
      cstring = c.to_ical
      
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{@url}#{calendar}/#{uuid}.ics")
        req['Content-Type'] = 'text/calendar'
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = cstring
        res = http.request( req )
      }
    end
    
    def new_todo_string(todo)
      c = Icalendar::Calendar.new
      uuid = todo[:uuid] #? todo[:uuid] : UUID.new.generate
      #raise DuplicateError if entry_with_uuid_exists?(uuid)
      # t = Icalendar::Todo.new

      #set timezone for event
      tz = (todo[:timezone] and todo[:timezone].to_s.strip.length > 0) ? todo[:timezone] : "America/Chicago"


      t = Icalendar::Todo.new
      t.uid           = uuid 
      t.dtstart       = DateTime.parse(todo[:start]) if todo[:start]
      t.duration      = todo[:duration] if todo[:duration]
      t.summary       = todo[:summary] if todo[:summary]
      t.description   = todo[:description] if todo[:description]
      t.location      = todo[:location] if todo[:location]
      t.percent_complete= todo[:percent_complete] if todo[:percent_complete]
      t.priority      = todo[:priority] if todo[:priority]
      t.geo           = todo[:geo] if todo[:geo]
      t.status        = todo[:status] if todo[:status]
      t.url           = todo[:url] if todo[:url]
      t.x_lcl_folderid       = todo[:folderid] if todo[:folderid]
      t.x_lcl_subtasks = todo[:x_lcl_subtasks] if todo[:x_lcl_subtasks]
      t.due           = DateTime.parse(todo[:due]).beginning_of_day() if todo[:due]

      #Add Event object to calendar
      c.add_todo(t)
      cstring = c.to_ical
      return cstring
    end
    
    def create_todos(todos, calendar)
      res = []
      __create_http.start { |http|
        todos.each do |todo|
            uuid = todo[:uuid].to_str
            uri = "#{@url}#{calendar}/#{uuid}.ics"
            req = Net::HTTP::Put.new(uri)
            req['Content-Type'] = 'text/calendar'
            if not @authtype == 'digest'
              req.basic_auth @user, @password
            else
              req.add_field 'Authorization', digestauth('PUT')
            end
            req.body = new_todo_string(todo)
            res << http.request( req )
        end
      }
    end
    
    def new_note_string(note)
      c = Icalendar::Calendar.new
      uuid = note[:uuid]
      # raise DuplicateError if entry_with_uuid_exists?(uuid)
      t = Icalendar::Journal.new
      t.uid           = uuid 
      t.dtstart       = DateTime.parse(note[:dtstart]) if note[:dtstart]
      t.summary       = note[:summary] if note[:summary]
      t.description   = note[:description] if note[:description]
      t.x_lcl_notecontent   = note[:x_lcl_notecontent] if note[:x_lcl_notecontent]
      t.floware_only   = note[:floware_only] if note[:floware_only]
      c.add_journal(t)
      cstring = c.to_ical
      return cstring
    end
    
    def create_note(note, calendar)
      c = Icalendar::Calendar.new
      uuid = UUID.new.generate
      # raise DuplicateError if entry_with_uuid_exists?(uuid)
      # t = Icalendar::Todo.new
      t = Icalendar::Journal.new
      t.uid           = uuid 
      t.dtstart       = DateTime.parse(note[:dtstart]) if note[:dtstart]
      t.summary       = note[:summary] if note[:summary]
      t.description   = note[:description] if note[:description]
      t.notecontent   = note[:notecontent] if todo[:notecontent]
      
      
      #Add Journal object to calendar
      c.add_journal(t)
      cstring = c.to_ical
      
      res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{@url}#{calendar}/#{uuid}.ics")
        req['Content-Type'] = 'text/calendar'
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = cstring
        res = http.request( req )
      }
    end

    def create_a_vtodo_by_strIcalEvent(uuid, cal_obj_data,calendar)
       res = nil
      __create_http.start { |http|
        req = Net::HTTP::Put.new("#{@url}#{calendar}/#{uuid}.ics")
        req['Content-Type'] = 'text/calendar'
        if not @authtype == 'digest'
          req.basic_auth @user, @password
        else
          req.add_field 'Authorization', digestauth('PUT')
        end
        req.body = cal_obj_data
        res = http.request( req )
      }
    end

    def createTimezone
      cal = Icalendar::Calendar.new
      cal.timezone do |t|
        t.tzid = "America/Chicago"
      
        t.daylight do |d|
          d.tzoffsetfrom = "-0600"
          d.tzoffsetto   = "-0500"
          d.tzname       = "CDT"
          d.dtstart      = "19700308T020000"
          d.rrule        = "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU"
        end
      
        t.standard do |s|
          s.tzoffsetfrom = "-0500"
          s.tzoffsetto   = "-0600"
          s.tzname       = "CST"
          s.dtstart      = "19701101T020000"
          s.rrule        = "FREQ=YEARLY;BYMONTH=11;BYDAY=1SU"
        end
      end
      return cal
    end
    
    def filterTimezone( vcal )
        data = ""
        inTZ = false
        vcal.split("\n").each{ |l| 
            inTZ = true if l.index("BEGIN:VTIMEZONE") 
            data << l+"\n" unless inTZ 
            inTZ = false if l.index("END:VTIMEZONE") 
        }
        data
    end
  
    private

    # convert item calendar object
    def convertToItem(ev, itemType = '')
      calobj = {                 
         'uid' => ev.uid ? ev.uid : '',
         'folderid' => ev.folderid ? ev.folderid[0] : '',
         'summary' => ev.summary ? ev.summary : '',
         'url' => ev.url ? ev.url : '',
         'location' => ev.location ? ev.location : '',
         'description' => (ev.description and ev.description[0]) ? ev.description[0] : '',                 
         'color' => ev.color ? ev.color[0] : '',
         'dtstamp' => ev.dtstamp ? ev.dtstamp : '',
         'dtstart' => ev.dtstart ? ev.dtstart : '',
         'dtend' => ev.dtend ? ev.dtend : '',
         'star' => ev.star ? ev.star[0] : '',
         'rrule' => ev.rrule ? ev.rrule[0] : '',
         'attendee' => ev.attendee ? ev.attendee : '',
         'sequence' => ev.sequence ? ev.sequence : 0 ,
         'type' => itemType,
         'stask' => ev.stask ? ev.stask : 0,
         'status' => ev.status ? true : false,                
         'created' => ev.created ? ev.created : ''           
      }
      if (itemType == API_VTODO)
        calobj['notecontent'] = ev.notecontent ? ev.notecontent : '' #base64 here
        calobj['done'] = ev.status ? true : false
      end
      if (itemType == API_VEVENT)
        calobj['alarms'] = ev.alarms ? ev.alarms : ''
        
      end
      if (itemType == API_VJOURNAL)
        
        
      end
      return calobj
    end

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


