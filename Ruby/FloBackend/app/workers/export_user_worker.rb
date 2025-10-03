class ExportUserWorker
  require "./lib/app_utils.rb"
  require './lib/agcaldav/client.rb'
  require 'icalendar/alarm.rb'
  require './lib/change_calendars'
  require 'json'
  include AppUtils
  include Sidekiq::Worker
  # Include thêm cái này để chúng ta có thể track status của 1 worker.
  # Các bạn có thể đọc thêm doc của sidekiq-status để có thêm chi tiết.
  include Sidekiq::Status::Worker
  attr :cal
  # before_action :authenticate_with_sabre_caldav_server

  def authenticate_with_sabre_caldav_server(email)
    user = User.find_by(email: email)
    begin
      private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
      password = private_key.private_decrypt(Base64.decode64(user.rsa))

      #authenticate and create new client
      caldav = {
          :url      => FLOL_CALDAV_SERVER_URL,
          :user     => CGI.escape(user.email),
          :password => password,
          :authtype => 'digest'
      }
      @cal = AgCalDAV::Client.new(:uri => caldav[:url], :user => caldav[:user] ,
                                  :password => caldav[:password], :authtype => caldav[:authtype])
    rescue Exception => ex
      ap ex
    end
    @cal
  end

  def perform(user_id, email, type_req, account_id, months, obj_type)
    authenticate_with_sabre_caldav_server(email)
    # byebug
    cals = Calendar.where(principaluri: "principals/#{email}")
    data_return = []
    count = 0
    count_valid = 0
    if cals
      # Báo cho SidekiqStatus rằng có tổng bao nhiêu cals
      total cals.size
      cals.each_with_index { |cal, index|
        invisible = false
        if !cal.invisible.nil?
          invisible = cal.invisible
        end

        cal_uri = cal.uri
        if account_id.to_i == 0
          if months.present?
            # Get data by months
            if months.length === 1
              month = months[0].to_s
              bom = Time.parse(month).utc.at_beginning_of_month
              eom = Time.parse(month).utc.at_end_of_month

              min_range = bom.prev_month
              max_range = eom.next_month
            else
              bom = Time.parse(months[0].to_s).utc
              eom = Time.parse(months[months.length - 1].to_s).utc

              min_range = bom
              max_range = eom
            end

          else
            # Get data in three months (Prev & Current & Next months)
            bom = Date.today.at_beginning_of_month
            eom = Date.today.at_end_of_month

            min_range = bom.prev_month
            max_range = eom.next_month
          end
          ############
          if type_req == "set"
            # pp cal
            cal_obj = @cal.check_change_calendar(cal_uri, obj_type, min_range..max_range)
          end
        else
          cal_obj = get_calendar_objects_3rd(cal_uri, uid, obj_type, account_id)
        end
        type_req = "get" if type_req.blank?

        key = "#{user_id}/#{cal_uri}/#{(min_range..max_range)}"

        data_one_calendar = nil
        cal_obj.each do |i|
          arr_valid = i["alarms"].map do |alarm|
            alarm.valid?
          end
          if arr_valid.all?
            count_valid += 1
          else
            # i["alarms"].each do |alarm|
            #   puts "[duration, repeat].compact.size == 1 and return false".red
            #   ap alarm
            #   alarm.parent = nil
            # end
            # i.delete("alarms")
            count += 1
          end
          i["alarms"].each do |alarm|
            alarm.parent = nil
          end
          # i.delete("alarms") unless arr_valid.all?
        end if cal_obj.present?
        # puts "---------cals-----------".green
        # ap cal_obj
        if type_req == "set"
          # puts "-------type is set-------".green
          ChangeCalendars.set(key, cal_obj.to_json) if cal_obj.present?
          data_one_calendar = cal_obj if cal_obj.present?
        elsif type_req == "get"
          # ap ChangeCalendars.get(key)
          data = ChangeCalendars.get(key)
          if data.present?
            data_one_calendar = JSON.parse(data)
          end
        elsif type_req == "delete"
          ChangeCalendars.delete(key)
        end
        data_return << data_one_calendar if data_one_calendar.present?
        # Báo cho SidekiqStatus rằng chúng ta đang thực hiện export đến cals thứ bao nhiêu
        # để nó tính toán % hoàn thành cho chúng ta sử dụng sau đó
        at (index+1)
        puts index.to_s.green
      }
    end
    # write file
    # File.open(Rails.root.join("tmp", "users_export_#{self.jid}.json"),"w") do |f|
    #   f.write(data_return.flatten.to_json)
    # end
    # don't use file
    ChangeCalendars.set(self.jid, data_return.flatten.to_json) if data_return.flatten.present?
  end
end