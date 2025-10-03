json.data @projects_users do |project_user|
  json.project_user do
    json.id project_user.id
    json.project_id project_user.project_id
    json.status project_user.status
    json.permission project_user.permission
    json.is_hide project_user.is_hide
    json.created_date project_user.created_date
    json.updated_date project_user.updated_date
  end
end
json.data_error @projects_users_errors if @projects_users_errors.present?
