json.data @projects do |project|
  json.project do
    json.merge! project.attributes.except('user_id', 'is_hide', 'info_card_order', 'state',
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
    if project.attributes['proj_type'] == Project::SHARED and project.owner.id != @current_user.id
      json.join_status project.projects_users.find_by(user_id: @current_user.id)&.status
      json.is_hide project.projects_users.find_by(user_id: @current_user.id)&.is_hide
    else
      json.is_hide project.attributes['is_hide']
    end
  end
end

if @projects_deleted
  json.data_del @projects_deleted do |project_deleted|
    json.deleted_item do
      json.merge! project_deleted.attributes.except('user_id')
    end
  end
end
