module AgCalDAV
  class CalendarsCollection < Array
    def []( name )
      select { | cal | cal.name.downcase == name }
    end
  end
end