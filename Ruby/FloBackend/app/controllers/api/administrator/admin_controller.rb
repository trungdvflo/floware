class Api::Administrator::AdminController < Api::Administrator::BaseController
  require 'digest/md5'
  require 'digest'
  require 'base64'

  EXCEPT_FIELDS = []

  #get user by paging
  def index
    #params
    pNumber = params[:pNumber] ? params[:pNumber] : 1
    pItem = params[:pItem] ? params[:pItem] : 50
    keyword = params[:keyword] ? params[:keyword] : ''
    criteria = params[:criteria] ? params[:criteria] : ''
    acsOrder = params[:asc] ? params[:asc] : 'true'
    group_ids = params[:group_ids].to_s

    #respond
    respond_list = Array.new()
    users = []

    users = Admin.get_users(group_ids.split(','), pItem, pNumber, keyword, criteria, acsOrder)

    total = [users: { total: 0}]
    total = Admin.count_total_users(group_ids.split(','), keyword) unless group_ids.empty?

    respond_list = {
      :total => total,
      :users => users
    }

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => ADMIN_USERS, :except => EXCEPT_FIELDS)}
    end
  end

  #general info statistic
  def dashboard
    #respond
    respond_list = Array.new()

    obj = Admin.dashboard()
    respond_list = obj[0] if obj

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => ADMIN_NAME, :except => EXCEPT_FIELDS)}
    end
  end

  #check user is admin
  def check_admin
    #get param user name
    email = params[:email]

    respond_list = Array.new()
    msg = {
      :error => CODE_NOT_ADMIN,
      :message => MSG_NOT_ADMIN
    }

    if email and email.length > 0
      #get exactly user name
      email = email.to_s.downcase.strip
      admin = Admin.where(email: email).first
      #check admin user
      if admin
        msg = {
          :error => CODE_SUCCESS,
          :message => MSG_ADMIN
        }
      end
    end

    respond_list = msg

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => ADMIN_USERS, :except => EXCEPT_FIELDS)}
    end
  end

  #https://www.pivotaltracker.com/story/show/145493363
  #Define Internal Tester and External Beta
  def reset_subs
    #parameters
    p = params[:pass] #for security
    pass = Digest::MD5.hexdigest(p)
    users = []
    if pass.to_s == API_SECURITY_RESET_SUBS
      users = Admin.get_users_for_subs()
    end

    #respond
    respond_list = Array.new()
    msg = {
      :error => 1,
      :description => "Can not reset subscription, please enter password!"
    }
    if users and users.length > 0

      #get subID
      yearlyPro = ""
      yearlyPre = ""
      subs = Subscription.all
      subs.each do |s|
        yearlyPro = s.id if s.order_number.to_i == 1
        yearlyPre = s.id if s.order_number.to_i == 3
      end

      # puts users.length

      users.each do |user|
        #is user internal >> upgrade to Pro yearly
        if user.is_user_internal.to_i == 1
          user.subID = yearlyPro
        else #external user
          storage = user.storage
          #set Pre account
          if (user.account_3rd.to_i <= 3) and (storage.to_i < API_STORAGE_10GB.to_i)
            user.subID = yearlyPre
          end
          #set Pro account
          if (user.account_3rd.to_i > 3) or (storage.to_i >= API_STORAGE_10GB.to_i)
            user.subID = yearlyPro
          end
        end
        # puts user.to_json if user[:email] == 'pro_6@123flo.com'

        Admin.auto_upgrade_account(user)
      end

      msg = {
        :error => 0,
        :users => users.length,
        :description => "Reset subscription successful!"
      }
    else #no user
      msg = {
      :error => 2,
      :description => "No new user found!"
    }
    end

    respond_list << msg

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => ADMIN_NAME, :except => EXCEPT_FIELDS)}
    end
  end

  def get_user_info
    #get param user name
    email = params[:email]

    respond_list = {}
    if email and email.length > 0
      #get exactly user name
      email = email.to_s.downcase.strip

      all_config_acc = SetAccount.get_all_3rd_acc_by_email(email)

      if all_config_acc
        respond_list[:configured_acc] = all_config_acc
      else
        respond_list[:configured_acc] = [{:error => 1}]
      end

      #get all messages size
      quota = Quota.where(username: email).first
      messages_size = 0
      if quota
        messages_size = quota[:bytes]
      end

      #get all caldav size
      caldav_vevent = CalendarObject.get_total_size_caldav(email, 'VEVENT')
      events_size = caldav_vevent[0][:total]

      caldav_vtodo = CalendarObject.get_total_size_caldav(email, 'VTODO')
      todos_size = caldav_vtodo[0][:total]

      caldav_vjournal = CalendarObject.get_total_size_caldav(email, 'VJOURNAL')
      vjournals_size = caldav_vjournal[0][:total]

      # total file size (note inline attachments)
      files = Files.get_total_size_file_by_email(email)
      note_files_size  = files[0][:total]

      #get all carddav size
      carddav = Cards.get_total_size_carddav(email)
      contacts_size  = carddav[0][:total]

      respond_list[:used_storage] = {
        message: messages_size.to_i,
        event: events_size.to_i,
        todo: todos_size.to_i,
        note: vjournals_size.to_i + note_files_size.to_i,
        contact: contacts_size.to_i
      }

      users = User.arel_table
      user = User.where(users[:email].eq(email)).first

      respond_list[:versions] = user.tracking_apps
                                    .select('app_version, build_number, flo_version, name, last_used_date')
                                    .order('users_tracking_apps.last_used_date DESC')
      respond_list[:groups] = user.groups
    end

    respond_to do |format|
      format.json {render :json => respond_list.to_json()}
    end
  end

  def update_subscription
    #get param user name
    email = params[:email]
    subs_type = params[:subs_type]
    subs_time = params[:subs_time]
    subs_id = params[:subs_id]

    respond_list = {}

    if subs_type && subs_time && subs_id
      subs_split = subs_id.split('.')
      subs_split.pop #remove last part (subs_time + subs_type)
      # new_subs_id = 'com.floware.flo.product' + subs_split.join(".") + '.' + (subs_time.to_str + subs_type.to_str).to_s.strip.downcase
      new_subs_id = ('com.floware.flo.product.' + subs_time.to_s.strip + subs_type.to_s.strip).to_s.strip.downcase

      email = email.to_s.strip.downcase
      #find user
      user = User.find_by(email: email)
      if user && new_subs_id
        # subs_details = SubPurchase.find(:all, :conditions => ['user_id = ?', user.id])
        subs_details = SubPurchase.where(user_id: user.id)
        if subs_details
          #Update "is_current" attribute of old subscriptions to '0'
          subs_details.each do |sd|
            sd.is_current = 0
            sd.save
          end

          #Add new SubsPurchase
          new_subs_purchase = SubPurchase.new
          new_subs_purchase.user_id = user.id
          new_subs_purchase.subID = new_subs_id
          new_subs_purchase.is_current = 1

          if new_subs_purchase.save
            respond_list = {:error => 0, :description => "Update successfully!"}
          else
            respond_list = {:error => 1, :description => "Error"}
          end
        end

      else # >"user && new_subs_id"
        respond_list = {:error => 1, :description => "Error"}
      end

    else # >subs_type && subs_time && subs_id
      respond_list = {:error => 1, :description => "Error"}
    end

    respond_to do |format|
      format.xml {render :xml => respond_list.to_xml()}
      format.json {render :json => respond_list.to_json()}
    end
  end

  def export_csv
    users = Admin.users_without_paging(params[:group_ids].split(','), params[:keyword])
    csv = ExportCSVService.new users, csv_attributes, csv_headers
    send_data csv.perform, filename: "flo_user_#{Time.now.strftime('%d%m%y_%H%M')}.csv"
  end

  def extend_expired_date
    emails = params[:emails]
    expired_date = params[:expired_date]

    return if emails.blank? or expired_date.blank?

    user_ids = []
    valid_emails = []

    emails.each do |email|
      user = User.find_by(email: email)
      if user.present?
        user_ids << user.id
        valid_emails << email
      end
    end

    if user_ids.present? and valid_time(expired_date)
      created_date = Time.at(expired_date.to_i).utc - 1.year

      SubPurchase.where(user_id: user_ids, is_current: 1).update_all(created_date: created_date.to_i)
    else
      valid_emails = []
    end

    render json: { data: valid_emails }
  end

  private

  def csv_attributes
    %w[fullname email account_3rd_emails].freeze
  end

  def csv_headers
    %w[FullName FloEmailAddress All3rdParyAddress].freeze
  end

  def valid_time(time)
    Time.at(time.to_i).utc.to_i - Time.now.utc.to_i > 0
  end
end
