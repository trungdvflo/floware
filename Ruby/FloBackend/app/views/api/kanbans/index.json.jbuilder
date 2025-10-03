json.data @kanbans do |kanban|
  json.kanban do
    json.merge! kanban.attributes.except('user_id', 'order_kbitem')
  end
end

if @kanbans_deleted
  json.data_del @kanbans_deleted do |kanban_deleted|
    json.deleted_item do
      json.merge! kanban_deleted.attributes.except('user_id')
    end
  end
end
