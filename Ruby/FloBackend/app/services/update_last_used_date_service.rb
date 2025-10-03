class UpdateLastUsedDateService
  BUILD_VERSION_MATCHER = /build ([\d.]+)/
  MAC_VERSION_MATCHER = /Mac OS X Version ([\d.]+)/
  IOS_VERSION_MATCHER = /([\d]+.[\d].[\d])/
  BROWSER_VERSION_MATCHER = /([\d]+.[\d])/
  FLO_VERSION_MATCHER = /Flo\/([\d.]+)/
  DEVICE_MODEL_MATCHER = /Device ([\s\w,.]+)/

  def initialize(browser, user_id, user_agent)
    @browser = browser
    @user_id = user_id
    @user_agent = user_agent
  end

  def execute
    # tracking_app.update_attributes updated_date: Time.now.utc.to_i
    users_tracking_app = UsersTrackingApp.first_or_initialize(user_id: @user_id, tracking_app_id: tracking_app.id)
    users_tracking_app.last_used_date = Time.now.utc.to_i
    users_tracking_app.save
  end

  private

  def tracking_app_name
    if @browser.name == 'Other' and mac_version != '0'
      @_name = 'Mac'
      mac_version
    end
    @_name ||= @browser.name
  end

  def full_version(custom_version = nil)
    @_full_version ||= custom_version || @browser.full_version[IOS_VERSION_MATCHER, 1] || @browser.full_version[BROWSER_VERSION_MATCHER, 1]  || '0'
  end

  def tracking_app
    name = tracking_app_name
    name = device_model unless device_model.empty?
    @_tracking_app ||= TrackingApp.first_or_create(name: name,
                                                   app_version: full_version,
                                                   flo_version: flo_version,
                                                   build_number: build_number)
  end

  def build_number
    @user_agent[BUILD_VERSION_MATCHER, 1] || '0'
  end

  def flo_version
    @user_agent[FLO_VERSION_MATCHER, 1] || '0'
  end

  def mac_version
    @_mac_version ||= full_version @user_agent[MAC_VERSION_MATCHER, 1] || '0'
  end

  def device_model
    @user_agent[DEVICE_MODEL_MATCHER, 1] || ""
  end
end
