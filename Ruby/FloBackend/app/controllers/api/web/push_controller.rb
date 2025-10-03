# class Api::Web::PushController < Api::Web::BaseController
  
  # require "#{PUSH_NOTI_LIB_PATH}pushmeup/version"
  # require "#{PUSH_NOTI_LIB_PATH}pushmeup/apple"    #for push notification Apple's device
  # require "#{PUSH_NOTI_LIB_PATH}pushmeup/android"
  # require "#{PUSH_NOTI_LIB_PATH}pushmeup/amazon"
  
  # require 'date'
  
  # EXCEPT_FIELDS = [:user_id]

  # # just for testing push notification with payload
  # def push_payload
    
    # res = {
      # :status => 0,
      # :items => []
    # }

    # payload = params[:payload] #push with payload json
    # quiet = params[:quiet] #push with quiet mode
    # text = params[:text] #text of quiet mode

    # view = params[:show_device] #view device of account
    # device_type = params[:device_type] ? params[:device_type].to_s.downcase! : "iphone"

    # user_id = 0
    # email = ""
    # if current_user_id
      # user_id = @user_id 
      # email = current_user_id.email
    # end

    # if user_id and user_id.to_i != 0
      # #get devices token list
      # devices = DeviceToken.where(user_id: user_id)
      # #connect apns
      # fp = "production19.pem"
      # case device_type
      # when "iphone"
        # fp = "production19.pem"
      # when "ipad"
        # fp = "apns-dev-cert.pem"
      # else
        # fp = "production19.pem"
      # end
      
      # connectAPNS(fp)

      # if devices and devices.length > 0
        # arrNoti = []
        # devices.each do |dv|
          # # push notification with payload
          # if payload
            # # msg = {
            # #   :title => payload["title"],
            # #   :subtitle => payload["subtitle"],
            # #   :body => payload["body"],
            # #   :messageID => payload["messageID"],
            # #   :email => payload["email"],
            # #   :folder => payload["folder"]
            # # }
            # msg = payload['alert'] ? payload['alert'] : "no data"
            # sound = payload['sound'] ? payload['sound'] : "default"
            # category = payload["category"] ? payload["category"] : "FLOWARE_NEW_INCOMMING_MESSAGE"

            # # APNS.send_notification(dv.device_token,:alert => "ok",:badge => 1, :sound => 'default')          
            # notiObj = APNS::Notification.new(dv.device_token, :alert => msg, :sound => sound, :category => category)          
            # arrNoti << notiObj
          # end

          # # push notification with quiet mode
          # if quiet and quiet.to_i == 1
            # txt = (text and text.to_s.strip.length > 0) ? text : "quiet mode"
            # # APNS.send_notification(dv.device_token,:alert => "ok",:badge => 1, :sound => 'default')          
            # notiObj = APNS::Notification.new(dv.device_token, :alert => text, :sound => 'default')          
            # arrNoti << notiObj
          # end
          
          # # view result of push
          # if view and view.to_i == 1
            # obj = {}
            # obj["content-available"] = 1
            # obj["device-token"] = dv.device_token
            # f = "%d-%m-%Y %I:%M:%S%p"
            # x = DateTime.strptime(dv.created_date.to_s,'%s')
            # y = DateTime.parse(x.to_s).strftime(f)
            # obj["created_date"] = y

            # res[:items] << obj
          # end
        # end

        # APNS.send_notifications(arrNoti) if arrNoti and arrNoti.length > 0

      # end


    # end

    # respond_to do |format|
      # format.json {render :json => res.to_json(:root => "push", :except => EXCEPT_FIELDS)}
    # end
  # end

  # #get info
  # def push_noti
    # email = params[:email]
    # ispush = params[:ispush]
    # ispush = (ispush and ispush.to_i == 1) ? 1 : 0
    # user = User.where(email: email).first
    # message = {}
    # res = []
    # if user
      # user_id = user.id
      # #get devices token list
      # devices = DeviceToken.where(user_id: user_id)
      # #connect apns
      # connectAPNS()
      
      # message["content-available"] = 1
      # # message["sound"] = 'default'
      # if devices and devices.length > 0
        # arrNoti = []
        # devices.each do |dv|
          # # APNS.send_notification(dv.device_token,:alert => "ok",:badge => 1, :sound => 'default')
          # if ispush == 1
            # notiObj = APNS::Notification.new(dv.device_token, :alert => "ok", :sound => 'default')
            # #add notification to array
            # arrNoti << notiObj 
          # end
          # obj = {}
          # obj["content-available"] = 1
          # obj["device-token"] = dv.device_token
          # f = "%d-%m-%Y %I:%M:%S%p"
          # x = DateTime.strptime(dv.created_date.to_s,'%s')
          # y = DateTime.parse(x.to_s).strftime(f)
          # obj["created_date"] = y
          # res << obj
        # end
        # if ispush == 1
          # APNS.send_notifications(arrNoti) if arrNoti and arrNoti.length > 0
        # end
      # end
    # end
    # respond_to do |format|
      # format.json {render :json => res.to_json(:root => "push", :except => EXCEPT_FIELDS)}
    # end
  # end
  
  # def connectAPNS(file_pem = "")
    # fp = (file_pem and file_pem.length > 0) ? file_pem : "production19.pem"
    # APNS.host = 'gateway.push.apple.com'
    # APNS.pem  = PUSH_NOTI_PEM_FILE.to_s + fp.to_s
    # # APNS.pem  = '/var/www/FloOnline/FlowOnlineServer/pem/production.pem'
    # APNS.port = 2195 
    # APNS.pass = ''
  # end
  
  # #QA testing
  # def subs_update
    # res = {}
    # storage = params[:storage] #bytes
    # acc_type = params[:account_type] ? params[:account_type] : "free" #free, pre, pro
    # expired = params[:expired]
    # email = params[:email]
    # if email and email.length > 0
      # res[:email] = email
      
      # user = User.where(email: email).first
      
      # #update storage
      # if storage and storage.to_i >= 0
        # config = {
          # :free => 5368709120,
          # :pre => 10737418240,
          # :pro => 107374182400
        # }
        
        # quota = Quota.where(username: email).first
        
        # #check logic storage
        # totalCurrent = quota.cal_bytes.to_i + quota.card_bytes.to_i + quota.file_bytes.to_i
        # quotaMail = 0
        # quotaMail = storage.to_i - totalCurrent.to_i
        
        # quota.bytes = quotaMail.to_i if quotaMail.to_i > 0 
        
        # if acc_type.to_s == 'pre' #pre account
          # quotaLeft = config[:pre].to_i - totalCurrent.to_i
        # elsif acc_type.to_s == 'pro' #pro account
          # quotaLeft = config[:pro].to_i - totalCurrent.to_i
        # else #free account
          # quotaLeft = config[:free].to_i - totalCurrent.to_i
        # end
        # user.quota_limit_bytes = ((quotaLeft.to_i - quotaMail.to_i) >= 0) ? quotaLeft.to_i : quotaMail.to_i
        
        # quota.num_sent = 0
        # quota.save
        
        # #update limit quota for user
        # user.save
        
        # res[:storage] = quota.bytes.to_i + quota.file_bytes.to_i + quota.cal_bytes.to_i + quota.card_bytes.to_i
      # end
      # #allow update expired date
      # if user and expired and expired.length > 0
        # subPC = SubPurchase.where(user_id: user.id).order(" id DESC").first
        # if subPC
          # puts Time.at(subPC.created_date.to_i)
          
          # d = DateTime.parse(expired.to_s)
          # d = d.end_of_day
          # subPC.created_date = d.to_i
          # subPC.save
          
          # it = {
            # :created_date => d,
            # :subID => subPC.subID
          # }
          
          # res[:purchase] = it 
        # else #free account
          # res[:description] = "Free account. Not found purchase"
        # end
      # end
    # end
    # respond_to do |format|
      # format.json {render :json => res.to_json(:root => "subs", :except => EXCEPT_FIELDS)}
    # end
  # end
  
  # #get list users disabled
  # def users_disabled
    # opt = {}
    # users = User.get_users_disabled(opt)
    # total = users.size
    # puts total
    # res = []
    # if total > 0
      # users.each do |obj|
          # it = {
            # :email => obj[3],
            # :created_date => obj[5],
            # :expired_date => obj[7]  
          # }
          # res << it
      # end
    # end
    # respond_to do |format|
      # format.json {render :json => res.to_json(:root => "users", :except => EXCEPT_FIELDS)}
    # end
  # end
  
  # #create
  # def create
    
  # end

  # #update
  # def update

  # end

  # #delete
  # def destroy

  # end
# end
