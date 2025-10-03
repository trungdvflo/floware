class Api::UsersController < Api::BaseController
  require 'digest/md5'
  require 'digest'
  require 'openssl'
  require 'base64'
  require "./lib/agcaldav.rb"
  require 'net/http'
  require 'uri'
  # require "aescrypt" #for password
  
  before_action :authenticate, :user_info, :set_headers, :except => 
    [:get_3rd_by_acc,:user_terminate,:verify_recaptcha,:create, :token, :recover_pass, :user_token, :reset_pass, :check_email, :verify_secondary_email, :get_floAcc_by_3rd]
  EXCEPT_FIELDS = [:appreg_id, :digesta1, :domain_id, :password, :username, :rsa, :id]  
  
  #get info application
  def index
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()
    user = User.find_by(id: user_id)
    if user
      # # decrypt answer to show on the UI
      # begin
        # private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)   
        # answer = ''   
        # answer = private_key.private_decrypt(Base64.decode64(user.answer)) if user.answer
        # user.answer = answer
        
        # password_txt =  Api::Utils.decrypt_rsa(user.rsa)
        # #hash password with AES
        # app_alias = params[:app_alias]
        # if app_alias and app_alias.to_s.length > 0
          # app_regObj = AppRegister.find_by_app_alias(app_alias)
          # appreg = ''
          # appreg = app_regObj.app_regId if app_regObj
          # password_aes = AESCrypt.encrypt(password_txt, appreg)
          # user[:pass_aes] = password_aes
        # end
      # rescue
      # end
      respond_list = user
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER,
                                                        :except => EXCEPT_FIELDS,
                                                        only: [:fullname, :description, :birthday, :email,
                                                               :gender, :updated_date,
                                                               :quota_limit_bytes, :disabled] )}
    end
  end
  
  #get user via token
  def user_token
    token = params[:token]
    respond_list = Array.new()
    if token and token.length > 0
      usr = User.where(token: token).first
      u = {}
      u["email"] = ''
      if usr
        u["email"] = usr.email 
      end
      respond_list << u
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER, :except => EXCEPT_FIELDS)}
    end
  end
  
  # rubocop:disable Metrics/MethodLength
  def create
    #parameters
    email = params[:email]
    secondary_email = params[:secondary_email]
    rsa_pass = params[:password] #hashed by RSA
    appalias = params[:alias] #to know account was created from application
    tz = params[:timezone]
    
    if rsa_pass.blank?
      @respond_list = {error: API_PASS_INVALID, description: MSG_PASS_INVALID }
      return
    end

    #respond
    @respond_list = {:error => API_USER_INVALID, :description => MSG_USER_INVALID}
    has_appalias = false
    has_sec_email = false
    validate_email = false
    
    #check email/ usernam valid
    if email and email.to_s.strip.length > 0
      arrEmail = email.split('@')
      # arrEmail = ''
      username = arrEmail[0] if arrEmail and arrEmail.length > 0
      if RestrictedUser.restricted? username
        @respond_list = { error: EMAIL_NOT_ALLOWED_CODE, description: MSG_EMAIL_NOT_ALLOWED }
        return
      end
      first = username[0]
      last = username[username.length - 1]
      arrPeriod = username.split('.')
      if (first == '.') or (first == '_') or (first == ' ')
        validate_email = false
      elsif (last == '.') or (last == '_') or (last == ' ')
        validate_email = false
      elsif arrPeriod and arrPeriod.length > 2
        validate_email = false
      elsif username and ((username.length < 3) or (username.length > 50))
        validate_email = false
      else #check with partern
        validate_email = true
      end 
    end
    
    #check application alias
    appreg_id = ""
    if appalias and appalias.to_s != ''
      appreg_obj = AppRegister.find_by(app_alias: appalias)
      if appreg_obj
        appreg_id = appreg_obj.app_regId
        has_appalias = true
      end
    else #not yet register application
      #TODO return error application register
      @respond_list = {:error => API_APPREG_INVALID, :description => MSG_APPREG_INVALID}
    end
    
    #check parameters valid
    if email and rsa_pass and has_appalias and validate_email
      #check email account
      email = email.to_s.strip.downcase
      user = User.find_by(email: email)
      if !user #user does not exist
        #create email account
        arrEmail = email.split('@')
        domainNm = arrEmail[1].to_s
        #get domain identify
        domain = VirtualDomain.find_by(name: domainNm)
        if domain #domain existed
          # begin
          
          #TODO: decode RSA password
          private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
          pass = private_key.private_decrypt(Base64.decode64(rsa_pass)) 
          
          #create account
          digesta1 = Api::Utils.dav_md5_password(email,REAL_NAME_DAV.to_s,pass)
          fn = params[:fullname]
          fullname = ''
          if fn and fn.to_s.length > 0
            fullname = fn
          else #get the name of email
            fullname = arrEmail[0].to_s
          end
          User.create_account(email, digesta1, pass, domain.id, appreg_id, fullname, rsa_pass, secondary_email)
          #create data default for account
          principal_obj = Principal.find_by(email: email)
          if !principal_obj
            principal = Principal.new()
            principal.uri = API_PRINCIPAL.to_s + email
            principal.displayname= email
            principal.email = email
            principal.save
          end
          
          #TODO: create setting and data default
          #create data default
          caldav = {
            :url      => FLOL_CALDAV_SERVER_URL.to_s, 
            :user     => CGI.escape(email),
            :password => pass.to_s,
            :authtype => 'digest'
          }
          agCaldav = AgCalDAV::Client.new(
            :uri => caldav[:url], 
            :user => caldav[:user] , 
            :password => caldav[:password], 
            :authtype => caldav[:authtype]
          )
          calendar_tz = agCaldav.createTimezone.to_ical
          
          #get user id
          newUser = User.find_by_email(email)
          
          opts = {
            :timezone => tz,
            :domain_id => domain.id,
            :agCaldav => agCaldav,
            :calendar_tz => calendar_tz
          }
          User.create_default_data(newUser, opts)
          
          #send mail welcome to Flow Online
          Thread.new do
            UserMailer.welcome_email(email).deliver_now
            # UserMailer.flo_tips1(email).deliver
          end
          
          # SendMail.create_default_mail(newUser.email)
          
          @respond_list = {:success => API_SUCCESS, :description => MSG_USER_CREATE_SUCESS}
        end
      else #email existed
       @respond_list = {:error => API_USER_EXISTED, :description => MSG_USER_EXISTED}  
      end
    end
  end
  # rubocop:enable Metrics/MethodLength
  
  #update application
  def update

    gender = [0, 1, 2]
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()
    user = User.find user_id
    if user
      user.fullname = params[:fullname] if params[:fullname]
      user.description = params[:description] if params[:description]
      #TODO: and others parameters of the user
      user.secondary_email = params[:secondary_email] if params[:secondary_email]
      user.question = params[:question] if params[:question]
      user.answer = params[:answer] if params[:answer]
      user.phone_number = params[:phone_number] if params[:phone_number]
      user.country = params[:country] if params[:country]
      user.birthday = params[:birthday] if params[:birthday]

      if gender.include? params[:gender].to_i
        user.gender = params[:gender].to_i
      else
        user.gender = 0
      end

      user.country_code = params[:country_code] if params[:country_code]
      
      user.save
      respond_list = user
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER,
                                                        :except => EXCEPT_FIELDS,
                                                        only: [:fullname, :description, :birthday, :email,
                                                               :gender, :updated_date,
                                                               :quota_limit_bytes, :disabled] )}
    end
  end
  
  #delete application
  def destroy
    #parameters
    
    #respond
    respond_list = Array.new()
    
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER, :except => EXCEPT_FIELDS)}
    end
  end
  
  def get_3rd_by_acc
    email = params[:email]
    #respond
    respond_list = Array.new()
    # respond_list = {"error" => 2, "description" => "You don't have any secondary email."}
    if email and email.to_s.strip.length > 0
      email = email.to_s.strip.downcase
      user = User.find_by(email: email)
      if user
        fields = "user_income,user_smtp,user_caldav"
        setAcc = SetAccount.where(user_id: user.id).select(fields)
        respond_list = setAcc #{"error" => 0, "sec_email" => setAcc}
      end
    end
    
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER, :except => EXCEPT_FIELDS)}
    end
  end
  
  #verify_secondary_email
  def verify_secondary_email
    #parameters
    token = params[:token]
    user_id = params[:email]
    #respond
    respond_list = Array.new()
    respond_list = {:error => API_USER_INVALID, :description => MSG_USER_INVALID}
    user = User.find_by(email: user_id, token: token)
    if user
      user.active_sec_email = 1 #active secondary email
      user.save
      respond_list = {:success => API_SUCCESS, :description => API_MSG_ACTIVED_SEC_MAIL}
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER, :except => EXCEPT_FIELDS)}
    end
  end
  
  # rubocop:disable Metrics/MethodLength
  def token
    email = params[:email]
    appalias = params[:alias]
    sig = params[:sig]

    respond_list = []
    token = ""
    keyapi = ""
    usr_des = "Flo"
    
    if email and email.to_s.strip != ''
      #get email account info
      email = email.to_s.strip.downcase
      account = User.find_by(email: email)
      if account
        usr_des = account.description.to_s.strip if account.description and account.description.to_s.strip.length > 0
        #check alias
        if appalias and appalias.to_s.strip != ''
          #get appreg ID
          appreg = AppRegister.find_by(app_alias: appalias)
          if appreg
            #check signature
            if sig and sig.to_s.strip != ""
              #generate signature
              digesta1_pass = account.digesta1 #get password from database
              sig_gen = Api::Utils.generate_signature(email, digesta1_pass, appreg.app_regId)
              if sig_gen.to_s == sig.to_s
                #return token
                found_token = AppToken.find_by(user_id: account.id, app_pregId: appreg.app_regId)
                expire_time = API_TIME_DEFAULT.to_i #4hours
                token = Api::Utils.generate_token(email, sig_gen.to_s)
                keyapi = Api::Utils.generate_keyapi(email, appreg.app_regId, token)
                expire_time_left = 0
              
                if found_token
                  expire_time = Time.now.to_i - found_token.time_expire.to_i
                  #TODO: return old token, is not expire
                  if expire_time > EXPIRE_TIME.to_i
                    #generate new token
                    found_token.token = token.to_s
                    found_token.key_api = keyapi.to_s
                    found_token.time_expire = Time.now.to_i
                    found_token.save
                    expire_time_left = EXPIRE_TIME
                  else
                    #return old token
                    token = found_token.token
                    expire_time_left = (EXPIRE_TIME.to_i - expire_time.to_i)
                  end
                else
                  #create new token
                  new_token = AppToken.new
                  new_token.user_id = account.id #this is user ID
                  new_token.email = account.email
                  new_token.app_pregId = appreg.app_regId
                  new_token.key_api = keyapi
                  new_token.token = token
                  new_token.time_expire = Time.now.to_i
                  new_token.save
                  expire_time_left = EXPIRE_TIME
                end
                #return token api
                # security = {:sd => account.secondary_email, :q => account.question}

                update_last_used_date(browser, account.id)

                respond_list = {:tokenapi => token.to_s,
                                :description => usr_des, 
                                :expireTimeLeft => expire_time_left,
                                :expireTime => (Time.now.utc.to_i + expire_time_left)}
              else
                #TODO: return signature invalid
                respond_list = {:error => API_SIG_INVALID, :description => MSG_SIG_INVALID}
              end
            else
              #TODO: return signature invalid
              respond_list = {:error => API_SIG_INVALID, :description => MSG_SIG_INVALID}
            end
          else
            #TODO: return application register invalid
             respond_list = {:error => API_APPREG_INVALID, :description => MSG_APPREG_INVALID}
          end
        else
          #TODO: return application register invalid
          respond_list = {:error => API_APPREG_INVALID, :description => MSG_APPREG_INVALID}
        end
      else #account not exist
        #TODO: return email account not existed
        respond_list = {:error => API_USER_INVALID, :description => MSG_USER_INVALID}
      end
    else #email invalid
      #TODO: return email invalid
       respond_list = {:error => API_USER_INVALID, :description => MSG_USER_INVALID}
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_TOKEN, :except => EXCEPT_FIELDS)}
    end
  end
  # rubocop:enable Metrics/MethodLength
  
  def user_terminate
    # #parameters
    # email = params[:email]
    # #respond
    # respond_list = Array.new()
    # respond_list = {:error => API_USER_INVALID, :description => MSG_EMAIL_INVALID}
    # if email and email.to_s.strip.length > 0
    #   email = email.to_s.strip.downcase
    #   #find user
    #   user = User.find(:first, :conditions => ['email = ?', email])
    #   if user
    #     condition = {:user_id => user.id}
    #     #delete urls
    #     Url.where(condition).destroy_all
    #     #delete tracking
    #     Tracking.where(condition).destroy_all
    #     #delete setting account
    #     SetAccount.where(condition).destroy_all
    #     #delete project (collection)
    #     Project.where(condition).destroy_all
    #     #delete object order
    #     ObjOrder.where(condition).destroy_all
    #     #delete links
    #     Link.where(condition).destroy_all
    #     #delete setting
    #     Setting.where(condition).destroy_all
    #     #delete deleted items
    #     DeletedItem.where(condition).destroy_all
    #     #delete VirtualAlias
    #     VirtualAlias.where({:source => email}).destroy_all
    #     #delete VirtualAlias
    #     Principal.where({:email => email}).destroy_all
    #     #delete Calendar
    #     principals = "principals/" + email
    #     Calendar.where({:principaluri => principals}).destroy_all
    #     #delete user
    #     if user.destroy()
    #       respond_list = {:error => 0, :description => "deleted user"}
    #     end
    #   end
    # end
    
    # respond_to do |format|
    #   format.xml {render :xml => respond_list.to_xml(:root => "terminate", :except => EXCEPT_FIELDS)}
    #   format.json {render :json => respond_list.to_json(:root => "terminate", :except => EXCEPT_FIELDS)}
    # end
  end
  
  #check email exist
  def check_email
    email = params[:email]
    @respond_list = {:error => API_USER_INVALID, :description => MSG_USER_NOT_EXISTED}
    if email and email.to_s.strip != ''
      email = email.to_s.strip.downcase
      if RestrictedUser.restricted? email
        @respond_list = { error: EMAIL_NOT_ALLOWED_CODE, description: MSG_EMAIL_NOT_ALLOWED }
        return
      end
      user = User.find_by(email: email)
      if user
        @respond_list = {:success => API_SUCCESS, :description => MSG_USER_EXISTED, :token => user.token}
      end
    end
  end
  
  #reset password via web
  def reset_pass
    #parameters
    rsa_pass = params[:rsa_pass]
    user_id = params[:email]
    token = params[:token]
    #respond
    respond_list = Array.new()
    respond_list = {:error => API_USER_INVALID, :description => MSG_USER_INVALID}
    user = User.find_by(email: user_id, token: token)
    if user and rsa_pass and (rsa_pass.to_s != "")
      email = user.email
      digesta1 = ""
      password = ""
      # begin
        password =  Api::Utils.decrypt_rsa(rsa_pass)
        digesta1 = Api::Utils.dav_md5_password(email,REAL_NAME_DAV.to_s,password)
        
        User.change_password(email, digesta1, password, rsa_pass)
        respond_list = user
        
        AppToken.delete_tokens(user_id)
    end
    
    respond_to do |format|
      format.xml {render :xml => respond_list.to_xml(:root => API_USER, :except => EXCEPT_FIELDS)}
      format.json {render :json => respond_list.to_json(:root => API_USER, :except => EXCEPT_FIELDS)}
    end
  end
  
  #change password
  def change_pass
    #parameters
    rsa_pass = params[:password]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()
    respond_list = {:error => API_USER_INVALID, :description => MSG_USER_INVALID}
    user = User.find user_id
    if user and rsa_pass and (rsa_pass.to_s != "")
      email = user.email
      digesta1 = ""
      password = ""
      begin
        password =  Api::Utils.decrypt_rsa(rsa_pass)
        digesta1 = Api::Utils.dav_md5_password(email,REAL_NAME_DAV.to_s,password)
        
        User.change_password(email, digesta1, password, rsa_pass)
        
        #delete the record of user token
        AppToken.delete_tokens(user_id)
        
        respond_list = user
      rescue
      end
    end
    
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER,
                                                        :except => EXCEPT_FIELDS,
                                                        only: [:fullname, :description, :email,
                                                               :token, :token_expire,
                                                               :quota_limit_bytes, :disabled] )}
    end
  end

  def islogged
    email = params[:email]
    mode_sign_in = params[:mode_sign_in]
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    respond_list = Array.new()
    if user_id
      user = User.find_by(id: user_id)
      if user

        jwt = ''
        if mode_sign_in && mode_sign_in.eql?('ZDSSO')
          email = email.to_s.strip.downcase
          jwt = create_jwt_zd_sso(user.username, email, user.fullname)
        end
        if jwt
          user.attributes.merge(jwt: jwt)
        end

        respond_list << user
        # check address book exist
        principal = API_PRINCIPAL.to_s + user.email.to_s
        ab = Addressbook.find_by_principaluri(principal)
        if !ab
          # create address book default
          addbook = Addressbook.new()
          addbook.principaluri = principal
          addbook.displayname = DEF_CALENDAR_NAME.to_s
          addbook.uri = UUID.new.generate
          addbook.description = DEF_CALENDAR_NAME.to_s
          addbook.save
        end

      else
        respond_list << {:error => API_USER_INVALID, :description => MSG_USER_INVALID}
      end
    else
      respond_list << {:error => API_USER_INVALID, :description => MSG_USER_INVALID}
    end

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER, :except => EXCEPT_FIELDS)}
    end
  end
  
  #verify captchar
  def verify_recaptcha
    remote_ip = request.remote_ip
    challenge = params[:challenge]
    resp = params[:resp]
    result = []
    uri = URI(GOOGLE_VERIFY_CAPTCHAR_LNK)
    responce = Net::HTTP.post_form(uri, 'privatekey' => RECAPTCHA_PRIVATE_KEY, 
                                        'remoteip' => remote_ip, 
                                        'challenge' => challenge, 
                                        'response' => resp)
    arrResponse = responce.body.split("\n")
    result = [{:status => arrResponse[0], :error_code => arrResponse[1]}]    
    respond_to do |format|
      format.json {render :json => result.to_json(:root => "res", :except => EXCEPT_FIELDS)}
    end
  end

  def get_floAcc_by_3rd
    email = params[:email]
    respond_list = Array.new()
    if email and email.to_s.strip.length > 0
      email = email.to_s.strip.downcase
      rdAccs = SetAccount.where(user_income: email).select('user_id')
      if rdAccs
        fields = "email"
        ids = ''
        rdAccs.each do |obj|
          ids = ids + obj.user_id.to_s + ','
        end
        
        ids = ids.to_s.chop
        if ids and ids.to_s.length > 0
          floAccs = User.where(id: ids.split(',')).select(fields)
          respond_list = floAccs
        end
      end
    end
    
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER, :except => EXCEPT_FIELDS)}
    end
  end

  def recover_pass
    email = params[:email]
    sec_email = params[:sd]
    # question = params[:question]
    # answer = params[:answer]
    respond_list = {:error => API_USER_INVALID, :description => MSG_EMAIL_INVALID}
    raise ApiUserInvalid if email.blank?
    email = email.strip.downcase
    user = User.find_by(email: email)
    raise ApiUserInvalid unless user
    if sec_email.present?
      raise ApiUserInvalid unless SetAccount.find_by(user_id: user.id, user_income: sec_email)

      newToken = Api::Web::Utils.generate_token(email, email.to_s)
      user.token = newToken
      user.token_expire = Time.now.to_i
      user.secondary_email = sec_email.to_s.strip.downcase

      #TODO: send the URL change password
      t_mail = Thread.new {
        UserMailer.recoverpass_email(user).deliver_now
      }
      t_mail.run
      user.save
      respond_list = {:success => API_SUCCESS, :description => API_MSG_CHECK_MAIL}
    # elsif question and question.to_s != '' and answer and answer.to_s != '' 
      # private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
      # ans_params = private_key.private_decrypt(Base64.decode64(answer))
      # ans_db = private_key.private_decrypt(Base64.decode64(user.answer)) 

      # #check question
      # if user.question and user.question.to_s == question.to_s and user.answer and ans_params.to_s == ans_db.to_s
        # respond_list = {:success => API_SUCCESS, :description => API_MSG_QUESTION_OK}
      # else
        # respond_list = {:error => API_USER_INVALID, :description => API_MSG_QUESTION_FAIL}
      # end
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_USER, :except => EXCEPT_FIELDS)}
    end
  end

  #delete users by user
  def terminate
    #parameters
    token = params[:token]
    
    #respond
    respond_list = {}
    respond_list = {:error => API_USER_INVALID, :description => MSG_EMAIL_INVALID}
    if token and token.to_s.strip.length > 0 
      #find user
      user = User.find_by(token: token)
      if user #check user exist
        #check token expire, the token just valid within 24 hours
        token_time = user.token_expire.to_i + API_TOKEN_EXPIRE.to_i
        today = Time.now.to_i
        if token and (today <= token_time)
          email = user.email
          condition = {:user_id => user.id}
          
          ########################### delete RDB #############
          #delete device tocken
          DeviceToken.where(condition).destroy_all
          #delete canvas
          Canvas.where(condition).destroy_all
          #delete deleted items
          DeletedItem.where(condition).destroy_all
          #device token
          DeviceToken.where(condition).destroy_all
          #history
          History.where(condition).destroy_all
          #import contact
          ImportContact.where(condition).destroy_all
          #delete Kanban
          Kanban.where(condition).destroy_all
          #delete links
          Link.where(condition).destroy_all
          #ObjOrder
          ObjOrder.where(condition).destroy_all
          #delete project (collection)
          Project.where(condition).destroy_all
          #Quota
          Quota.where({:username => email}).destroy_all
          #delete setting account
          SetAccount.where(condition).destroy_all
          #delete setting
          Setting.where(condition).destroy_all
          #delete tracking
          Tracking.where(condition).destroy_all
          #delete Trash
          Trash.where(condition).destroy_all
          #delete urls
          Url.where(condition).destroy_all
          
          ########################### delete mail DB #############
          #delete VirtualAlias
          VirtualAlias.where({:source => email}).destroy_all
          
          ########################### delete CalDAV, CardDAV #############
          #delete Calendar
          principals = "principals/" + email
          Calendar.where({:principaluri => principals}).destroy_all
          #delete Addressbook
          Addressbook.where({:principaluri => principals}).destroy_all
          #delete VirtualAlias
          Principal.where({:email => email}).destroy_all
          
          ########################### delete files #############
          #delete file
          Files.delete_files_by_userID(user.id)
          
          ########################### delete user #############
          #delete user
          user.destroy()
          
          msg = MSG_TERMINATE_SUCCESS
          msg = msg.gsub("@flo@", email.to_s)
          respond_list = {:error => API_SUCCESS, :description => msg}
          
        else #token expired
          respond_list = {:error => API_TOKEN_EXPIRED, :description => MSG_TERMINATE_EXPIRED}
        end
        
      else #user does not exist
          respond_list = {:error => API_USER_NOT_EXISTED, :description => MSG_TERMINATE_ACC_NOT_EXIST}
      end
    end
    
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => "terminate", :except => EXCEPT_FIELDS)}
    end
  end
  
  private

  def update_last_used_date(browser, user_id)
    UpdateLastUsedDateService.new(browser, user_id, request.user_agent).execute
  end

  def create_jwt_zd_sso(user_name, email, full_name)
    # This is the meat of the business, set up the parameters you wish
    # to forward to Zendesk. All parameters are documented in this page.
    iat = Time.now.to_i
    jti = "#{iat}/#{SecureRandom.hex(18)}"

    payload = JWT.encode({
      :iat   => iat, # Seconds since epoch, determine when this token is stale
      :jti   => jti, # Unique token id, helps prevent replay attacks
      :name  => full_name || user_name,
      :email => email
      # :remote_photo_url => avatar
    }, ZENDESK_SHARED_SECRET)

    return payload
  end
end
