Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  def draw(routes_name)
    instance_eval(File.read(Rails.root.join("config/routes/#{routes_name}.rb")))
  end

  namespace :api do
    draw :v2

    namespace :web do
      draw :web
    end

    namespace :administrator do
      draw :administrator
    end
  end

  require 'sidekiq/web'
  require 'admin_constraint'
  post 'sidekiq/login' => 'sidekiq_cus#login'
  constraints AdminConstraint.new do
    mount Sidekiq::Web => 'sidekiq'
  end
  get 'sidekiq/logout' => 'sidekiq_cus#logout'
end
