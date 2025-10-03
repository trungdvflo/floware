require 'builder'

module CardDav
    NAMESPACES = { "xmlns:d" => 'DAV:', "xmlns:c" => "urn:ietf:params:xml:ns:caldav", "xmlns:a" => "http://apple.com/ns/ical/"}
    YAHOO_NAMESPACES = { "xmlns:D" => 'DAV:', "xmlns:C" => "urn:ietf:params:xml:ns:caldav", "xmlns:AI" => "http://apple.com/ns/ical/"}
    TIME_FORMAT = '%Y%m%dT%H%M%SZ'
    module Request
        class Base
            def initialize
                @xml = Builder::XmlMarkup.new(:indent => 2)
                @xml.instruct!
            end
            attr :xml
        end

        class Mkcalendar < Base
            attr_accessor :displayname, :description, :time_zone, :color

            def initialize(displayname = nil, description = nil, time_zone = nil, color = nil)
                @displayname = displayname
                @description = description
                @time_zone = time_zone
                @color = color
                super()
            end 
            
            def to_xml
                xml.c :mkcalendar, NAMESPACES do
                    xml.d :set do
                        xml.d :prop do
                            xml.d :displayname, displayname unless displayname.to_s.empty?
                              # xml.a "calendar-color", :color, color unless color.to_s.empty?
                            xml.tag! "a:calendar-color", color unless color.to_s.empty?
                            xml.tag! "c:calendar-description", description, "xml:lang" => "en" unless description.to_s.empty?
                            xml.tag! "c:supported-calendar-component-set" do
                              xml.tag! "c:comp", "name" => "VEVENT"
                              xml.tag! "c:comp", "name" => "VTODO"
                              xml.tag! "c:comp", "name" => "VJOURNAL"
                              xml.tag! "c:comp", "name" => "VFREEBUSY"
                              xml.tag! "c:comp", "name" => "VALARM"
                            end
                            xml.tag! "c:calendar-timezone" do
                              xml.cdata! time_zone unless time_zone.to_s.empty?
                            end
                        end
                    end
                end
            end
        end    
        class Mkcol < Base
           attr_accessor :displayname, :description

            def initialize(displayname = nil, description = nil)
                @displayname = displayname
                @description = description
                super()
            end
            
            def to_xml
                xml.c :mkcol, NAMESPACES do
                    xml.d :set do
                        xml.d :prop do
                            xml.d :resourcetype do
                               xml.d :collection
                               xml.c :calendar
                            end
                            xml.d :displayname, displayname unless displayname.to_s.empty?
                            xml.tag! "c:calendar-description", description, "xml:lang" => "en" unless description.to_s.empty?
                        end
                    end
                end
            end 
        end
        
        class ReportVEVENT < Base
            attr_accessor :prop, :tstart, :tend, :range, :summary

            def initialize( prop = nil, summary = nil, range = nil, tstart=nil, tend=nil)
                @prop = prop                
                @tstart = tstart
                @tend   = tend
                @range = range
                @summary = summary
                super()
            end

            def to_xml
               xml.c 'calendar-query'.intern, NAMESPACES do
                    xml.d :prop do
                        xml.d :getetag
                        xml.c 'calendar-data'.intern
                    end
                    xml.c :filter do
                        xml.c 'comp-filter'.intern, :name => 'VCALENDAR' do
                            xml.c 'comp-filter'.intern, :name => 'VEVENT' do
                              if(prop.eql?('summary'))
                                xml.c 'prop-filter'.intern, :name => 'SUMMARY' do
                                  xml.c 'text-match'.intern, summary, :caseless=> 'no'
                                end
                              end
                              if(prop.eql?('folderid'))
                                xml.c 'prop-filter'.intern, :name => 'FOLDERID' do
                                  xml.c 'text-match'.intern, summary, :caseless=> 'no'
                                end
                              end
                              if(prop.eql?('time-range'))
                                if(range.nil?)
                                  xml.c 'time-range'.intern, :start=> "#{tstart}Z", :end=> "#{tend}Z"
                                else
                                  xml.c 'time-range'.intern, :start=> "#{range.begin.strftime(TIME_FORMAT)}", :end=> "#{range.end.strftime(TIME_FORMAT)}"
                                end
                              end
                            end
                        end
                    end
                end
            end
        end    
        
        class ReportVEVENTYAHOO < Base
            attr_accessor :prop, :tstart, :tend, :range, :summary

            def initialize( prop = nil, summary = nil, range = nil, tstart=nil, tend=nil)
                @prop = prop                
                @tstart = tstart
                @tend   = tend
                @range = range
                @summary = summary
                super()
            end

            def to_xml
               xml.C 'calendar-query'.intern, YAHOO_NAMESPACES do
                    xml.D :prop do
                        xml.D :getetag
                        xml.C 'calendar-data'.intern
                    end
                    xml.C :filter do
                        xml.C 'comp-filter'.intern, :name => 'VCALENDAR' do
                            xml.C 'comp-filter'.intern, :name => 'VEVENT' do
                              if(prop.eql?('summary'))
                                xml.C 'prop-filter'.intern, :name => 'SUMMARY' do
                                  xml.C 'text-match'.intern, summary, :caseless=> 'no'
                                end
                              end
                              if(prop.eql?('folderid'))
                                xml.C 'prop-filter'.intern, :name => 'FOLDERID' do
                                  xml.C 'text-match'.intern, summary, :caseless=> 'no'
                                end
                              end
                              if(prop.eql?('time-range'))
                                if(range.nil?)
                                  xml.C 'time-range'.intern, :start=> "#{tstart}Z", :end=> "#{tend}Z"
                                else
                                  xml.C 'time-range'.intern, :start=> "#{range.begin.strftime(TIME_FORMAT)}", :end=> "#{range.end.strftime(TIME_FORMAT)}"
                                end
                              end
                            end
                        end
                    end
                end
            end
        end 

        class ReportVTODO < Base
            def to_xml
                xml.c 'calendar-query'.intern, NAMESPACES do
                    xml.d :prop do
                        xml.d :getetag
                        xml.c 'calendar-data'.intern
                    end
                    xml.c :filter do
                        xml.c 'comp-filter'.intern, :name=> 'VCALENDAR' do
                            xml.c 'comp-filter'.intern, :name=> 'VTODO'
                        end
                    end
                end
            end
        end    
    end
end
