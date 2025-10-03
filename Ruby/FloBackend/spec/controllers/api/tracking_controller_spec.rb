describe Api::TrackingController, type: :controller do
  include_context 'initialize auth with app_token'
  include_examples :index_spec, Tracking, "tracking", [:modifiedGTE, :modifiedLT, :ids, :minID, :pItem, :fields]
  include_examples :destroy_spec, Tracking, "tracking", [:id, :re_ids]
  include_examples :resources, Tracking, "tracking", [:create, :update]
end
