# json.data @projects_users do |project_user|
  # json.project_user do
    # json.project_id project_user.project_id
    # json.email project_user.user.email
  # end
# end
# json.data_error @projects_users_errors if @projects_users_errors.present?

json.data do
  json.projects_users @projects_users do |project_user|
    json.id project_user.id
    json.project_id project_user.project_id
    json.email project_user.user.email
    json.status project_user.status
    json.permission project_user.permission
    json.created_date project_user.created_date
    json.updated_date project_user.updated_date
  end

  json.projects_cards @projects_cards do |project_card|
    json.project_id project_card.project_id
    json.card_uid project_card.card_uid
    json.href project_card.href
    json.set_account_id project_card.set_account_id
  end
end

if @projects_cards_errors.present? or @projects_users_errors.present?
  json.data_error do
    json.projects_users_errors @projects_users_errors if @projects_users_errors.present?
    json.projects_cards_errors @projects_cards_errors if @projects_cards_errors.present?
  end
end
