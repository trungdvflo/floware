describe Api::SetaccountsController, type: :controller do
  include_context 'initialize auth with app_token'
  include_examples :index_spec, SetAccount, "set_accounts", [:modifiedGTE, :modifiedLT, :ids, :minID, :pItem, :fields]
  include_examples :destroy_spec, SetAccount, "set_accounts", [:id]
  include_examples :resources, SetAccount, "set_accounts", [:create, :update]
end
