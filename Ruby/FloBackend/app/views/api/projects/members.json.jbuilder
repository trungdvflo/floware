json.data @shared_projects do |project|
  json.members do
    json.project_id project.id
    json.users project.projects_users do |project_user|
      json.email project_user.user.username
      json.join_status project_user.status
    end

    json.cards project.projects_cards do |project_card|
      json.card_uid project_card.card_uid
      json.href project_card.href
      json.set_account_id project_card.set_account_id
    end
  end
end
