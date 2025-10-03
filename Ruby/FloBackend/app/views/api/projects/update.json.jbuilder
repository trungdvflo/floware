json.data @projects do |project|
  json.project do
    json.merge! project.attributes.except('user_id', 'info_card_order', 'state',
                                          'kanban_mode', 'view_sort',
                                          'current_mode', 'order_storyboard', 'order_kanban')
    begin
      if project.alerts.empty?
        json.alerts JSON.parse('[]')
      else
        json.alerts JSON.parse(project.alerts)
      end
    rescue
      json.alerts JSON.parse('[]')
    end
  end
end
json.data_error @projects_errors if @projects_errors.present?
