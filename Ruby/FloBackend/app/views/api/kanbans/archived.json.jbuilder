json.data @kanbans do |kanban|
  json.kanban do
    json.merge! kanban.attributes.except('user_id', 'order_kbitem')
  end
end
