json.data @canvas do |canvas|
  json.canvas do
    json.merge! canvas.attributes.merge(ref: canvas.ref).except('user_id', 'collection_id', 'item_card_order')
  end
end

json.data_error @canvas_errors if @canvas_errors.present?
