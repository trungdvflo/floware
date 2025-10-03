FactoryBot.define do
  factory :calendar_object, class: 'CalendarObject' do
    calendardata "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Flo Online//EN\nMETHOD:PUBLISH\nCALSCALE:GREGORIAN\nBEGIN:VTODO\nUID:3c6cc1fe-a17c-4983-8a1c-751a7aafb9ec\nDTSTAMP:20180917T032548Z\nLAST-MODIFIED:20180917T032548Z\nCREATED:20180917T032548Z\nSUMMARY:todo_xxx\nDURATION:PT30M\nDTSTART;TZID=Asia/Jakarta:20180917T102548\nEND:VTODO\nEND:VCALENDAR"
    componenttype 'VTODO'
    uri { UUID.new.generate }
    uid { UUID.new.generate }
    calendarid 1
    etag { Digest::MD5.hexdigest('TODO data')}

    lastmodified { Time.zone.now.to_i }
  end
end
