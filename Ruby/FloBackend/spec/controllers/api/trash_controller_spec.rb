describe Api::TrashController do
  include_context 'initialize auth with app_token'
  # include_examples :index_spec, Trash, "trash", [:modifiedGTE, :modifiedLT, :ids, :minID, :pItem, :fields]
  include_examples :destroy_spec, Trash, "trash", [:id, :re_ids]
  # include_examples :resources, Trash, "trash", [:create, :update]
end
