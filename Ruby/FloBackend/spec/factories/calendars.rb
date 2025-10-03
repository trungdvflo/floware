FactoryBot.define do
  factory :calendar do
    principaluri 'principals/tho.vo@123flo.com'
    components 'VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM'
    uri { UUID.new.generate }
  end
end
