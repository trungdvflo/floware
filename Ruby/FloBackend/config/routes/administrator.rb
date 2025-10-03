resources :admin, :except => [:new, :show, :edit] do
  collection do
    get 'export_csv', to: 'admin#export_csv'
    post 'extend_expired_date', to: 'admin#extend_expired_date'
  end
end

get "/check_admin" => "admin#check_admin"
get "/dashboard" => "admin#dashboard"
get "/reset_subs" => "admin#reset_subs"
get "/user_info_in_admin" => "admin#get_user_info"
post "/update_subscription" => "admin#update_subscription"


resources :groups, except: [:new, :edit] do
  collection do
    post 'users', to: 'groups#add_users'
    get ':id/users', to: 'groups#users'
  end
  member do
    delete 'users', to: 'groups#remove_users'
  end
end
