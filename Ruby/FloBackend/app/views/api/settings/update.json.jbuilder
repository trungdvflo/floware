json.data do
  if @setting.present?
    json.setting do
      json.merge! @setting.attributes.except('user_id', 'm_ade', 'm_event', 'm_task', 'emailbox_order', 'infobox_order',
                                            'm_stask', 'm_done_task', 'm_due_task', 'm_note',
                                            'dw_due_task', 'dw_ade', 'dw_done_task', 'dw_note', 'order_todo')
      begin
        json.working_time JSON.parse(@setting.working_time)
      rescue
      end

      begin
        json.keep_state JSON.parse(@setting.keep_state)
      rescue
      end

      begin
        json.recent_tz JSON.parse(@setting.recent_tz)
      rescue
      end
    end
  end
end

if @setting_errors.present?
  json.data_error @setting_errors
end
