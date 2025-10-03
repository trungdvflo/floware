json.data @kanbans do |kanban|
  json.kanban do
    json.merge! kanban.attributes.merge(ref: kanban.ref).except('user_id', 'order_kbitem')
  end
end

if @kanbans_errors.present?
  json.data_error @kanbans_errors
end
