json.data @canvas do |canvas|
  json.canvas do
    json.merge! canvas.attributes.except('user_id', 'collection_id', 'item_card_order')
  end
end

if @canvas_deleted
  json.data_del @canvas_deleted do |canvas_deleted|
    json.deleted_item do
      json.merge! canvas_deleted.attributes.except('user_id')
    end
  end
end
