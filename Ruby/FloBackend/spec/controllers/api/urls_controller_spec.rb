describe Api::UrlsController, type: :controller do
  include_context 'initialize auth with app_token'
  include_examples :index_spec, Url, "url", [:modifiedGTE, :modifiedLT, :ids, :minID, :pItem, :fields]
  include_examples :destroy_spec, Url, "url", [:id, :re_ids]
  include_examples :resources, Url, "url", [:create, :update]
end
