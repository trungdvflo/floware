class SidekiqCusController < ActionController::Base
  skip_forgery_protection

  def logout
    render json: { status: :ok }
  end

  def login
    keyapi = params["keyapi"]
    if keyapi.present?
      return render json: {
          location: "/sidekiq?keyapi=#{keyapi}"
      }
    end
    render json: { location: "" }
  end
end