module AgCalDAV
  module ManualParser    
    class Parser      
      def parse_calendar(res, provider, param)
        prefix = { 
          :d      => 'd:',
          :ical   => 'ical:',
          :caldav => 'caldav:'
        }
        
        if provider == 1 #GOOGLE
          prefix = { 
            :d      => 'D:',
            :ical   => 'ical:',
            :caldav => 'caldav:'
          }
        elsif provider == 2 #YAHOO
          prefix = { 
            :d      => 'DAV:',
            :ical   => 'AI:',
            :caldav => ''
          }
        elsif provider == 5 #ICLOUD
          prefix = { 
            :d      => '',
            :ical   => '',
            :caldav => ''
          }
        end
        
        result = Array.new
        begin
          xml = REXML::Document.new( res.body )
          xml.elements.each(prefix[:d] + 'multistatus/' + prefix[:d] + 'response') do |elm|
            e = elm.elements
            
            href = e[prefix[:d] + 'href']
            if provider == 1 #GOOGLE
              next if href.nil? || (href.text.gsub('%40', '@')).eql?(param) || (href.text.gsub('%40', '@')).eql?(param + 'user')
            elsif provider == 2 #YAHOO
              username = param.split('@')[0]
              next if href.nil? || href.text.eql?('/dav/'+username+'/Calendar/')
            elsif provider == 5 #ICLOUD
              username = param.split('@')[0]
              next if href.nil? #|| href.text.eql?('/' + param + '/calendars/')
            end
            
            item = {}
            item['uri'] = href.text
            
            
            item['is_read_only'] = true
            e.each(prefix[:d] + 'propstat') do |propElm|
              prop = propElm.elements 
              
              supportedCalComSet = Array.new
              if !prop[prefix[:d] + 'prop/supported-calendar-component-set'].nil?
                  prop[prefix[:d] + 'prop/supported-calendar-component-set'].each do |comElm| 
                    next if !comElm.to_s.include?('comp')              
                    co = comElm.attribute('name').value()           
                    supportedCalComSet << co
                  end
              end
              
              display_name    = prop[prefix[:d] + 'prop/' + prefix[:d] + 'displayname']
              calendar_color  = prop[prefix[:d] + 'prop/' + prefix[:ical] + 'calendar-color']
              description     = prop[prefix[:d] + 'prop/' + prefix[:caldav] + 'calendar-description']
              is_read_only = prop[prefix[:d] + 'prop/' + prefix[:d] + 'current-user-privilege-set/' + prefix[:d] + 'privilege/' + prefix[:d] + 'write-content']
              
              if !display_name.nil? &&  !display_name.text.nil? then
                item['displayname'] = display_name.text
              end
              
              if !calendar_color.nil? && !calendar_color.text.nil? then
                item['calendarcolor'] = calendar_color.text
              end
              
              if !description.nil? && !description.text.nil? then
                item['description'] = description.text
              end
              
              if !supportedCalComSet.nil? && !supportedCalComSet.empty?
                item['supportedCalComSet'] = supportedCalComSet
              end
              
              if !is_read_only.nil?
                item['is_read_only'] = false
              end
            end
            
            next if item['displayname'].nil?
            result << item
          end
        rescue
        end

        return result
      end
      
      def parse_calendar_object(res, provider, calendar_uri)
        prefix = { 
          :d      => 'd:',
          :ical   => 'ical:',
          :caldav => 'caldav:'
        }
        
        if provider == 1 #GOOGLE
          prefix = { 
            :d      => 'D:',
            :ical   => 'ical:',
            :caldav => 'caldav:'
          }
        elsif provider == 2 #YAHOO
          prefix = { 
            :d      => 'DAV:',
            :ical   => 'AI:',
            :caldav => ''
          }
        elsif provider == 5 #ICLOUD
          prefix = { 
            :d      => '',
            :ical   => '',
            :caldav => ''
          }
        elsif provider == 0 #FLO
          prefix = { 
            :d      => 'd:',
            :ical   => 'cs:',
            :caldav => 'cal:'
          }
        end
        
        result = Array.new
        begin
          xml = REXML::Document.new( res.body )
          xml.elements.each(prefix[:d] + 'multistatus/' + prefix[:d] + 'response') do |elm|
            e = elm.elements
            uri = calendar_uri
            if calendar_uri.nil?
              uri = e['href'].text
            end
            
            calendar_data = e[prefix[:d] + 'propstat/' + prefix[:d] + 'prop/' + prefix[:caldav] + 'calendar-data'];
            next if calendar_data.nil? || calendar_data.text.nil?
            item = {
              'id' => -1,
              'calendarid' => -1,
              'calendardata' => calendar_data.text,
              'uri' => uri
            }
            
            result << item
          end
        rescue
        end
        return result
      end
    end
  end
end