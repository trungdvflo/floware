module ApiControllerHelper
  def stub_authenticate_with_app_token(token)
    allow_any_instance_of(Api::Web::BaseController).to receive(:authenticate).and_return(token)
    allow_any_instance_of(Api::Web::BaseController).to receive(:current_user_id).and_return(token)
    allow_any_instance_of(Api::BaseController).to receive(:authenticate).and_return(token.user)
    allow_any_instance_of(Api::BaseController).to receive(:current_user_id).and_return(token)
    allow_any_instance_of(Api::Administrator::BaseController).to receive(:authenticate).and_return(token)
    allow_any_instance_of(Api::Administrator::BaseController).to receive(:current_user_id).and_return(token)
    allow_any_instance_of(Api::BaseController).to receive(:current_user).and_return(token.user)
  end
end

RSpec.configure do |config|
  config.include ApiControllerHelper
end
