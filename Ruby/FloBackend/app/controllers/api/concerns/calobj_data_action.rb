require 'active_support/concern'

module Api::Concerns::CalobjDataAction
  extend ActiveSupport::Concern

  private
    def __do_get_calobj_data(item)
      user_info = {
          :email => @email,
          :user_id => @user_id
      }
      objType = item["componenttype"]
      uid = item["uid"]

      if uid.present?
        uid = uid.split(',')
      end

      cal_objs = CalendarObject.get_calendar_objects(user_info, objType, uid, nil, nil)
      objs = Api::Web::Utils.convert_calendar_obj(cal_objs, false) if cal_objs
      # objs = {:data => [{}]}
      obj = objs[:data].first
    end
end