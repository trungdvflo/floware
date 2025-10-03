class SubPurchase < ApplicationRecord
  require 'date'

  self.table_name = "subscription_purchase"
  self.primary_key = "id"

  belongs_to :subscription, foreign_key: :subID

  after_initialize :defaults, if: :new_record?

  before_create :set_create_time
  # before_update :set_update_time

  #get all subscription purchase
  def self.get_subs_purchase_history (user_id)
    subs = SubPurchase.where(user_id: user_id)
    res = []
    if subs and subs.length > 0
      subs.each do |sub|
        obj = {}
        obj[:id] = sub.id
        obj[:subID] = sub.subID
        obj[:description] = sub.description
        obj[:created_date] = sub.created_date
        obj[:purchase_type] = sub.purchase_type
        obj[:purchase_status] = sub.purchase_status
        res << obj
      end
    end
    return res
  end

  # rubocop:disable Metrics/MethodLength
  def self.get_subs_current_purchase(user)
    #TODO: should update sql just get: items are not expire and is_current = 1

    sql = " SELECT sp.*, su.name, su.price, su.period, su.subs_type, su.order_number "
    sql << " FROM subscription_purchase sp "
    sql << " LEFT JOIN subscriptions su on su.id = sp.subID "
    sql << " WHERE sp.user_id = :user_id"
    sql << " ORDER BY sp.id DESC "

    info = {}
    subsPurchase = SubPurchase.find_by_sql([sql, { user_id: user.id }])

    nuber3rd = SetAccount.where(user_id: user.id)
    quota = Quota.where(username: user.email).first
    used = 0

    #################################################
    #TODO:for QA testing, need to remove on .net
    begin
      used = quota.qa_bytes ? quota.qa_bytes.to_i : 0
    rescue
    end
    #################################################

    used = used.to_i + quota.cal_bytes.to_i + quota.card_bytes.to_i + quota.file_bytes.to_i + quota.bytes.to_i

    #purchase account
    if subsPurchase and subsPurchase.length > 0

      #step by step to get current subscription
      #1 - get all subscriptions have not expired
      #2 - sort them to pro yearly, pro monthly and premium account type
      #3 - get max susbcription of the list
      subsCurrent = []
      subsNotExpire = [] #list subscriptions purchase not expire
      today = Date.today

      #set default current purchase is lastest purchase
      subsCurrentObj = subsPurchase[0]

      #get current purchase with flag current purchase = 1
      subsPurchase.each do |sp|
        subsCurrentObj = sp if sp.is_current.to_i == 1
        expireDatePC = Time.at(sp.created_date.to_i + sp.period*24*60*60)
        #get list items not yet expire
        if expireDatePC.to_date > today
          subsNotExpire << sp
        end
      end

      #is_current = 1
      expireDate = Time.at(subsCurrentObj[:created_date].to_i + subsCurrentObj[:period]*24*60*60)

      #have items not expire and current purchase expired
      if (subsNotExpire.length > 0) and (expireDate.to_date < today)
        first = 0 #set first time
        subsNotExpire.each do |sp|
          #get purchase not yet expire
          expireDatePC = Time.at(sp.created_date.to_i + sp.period*24*60*60)
          if expireDatePC.to_date > today #item not yet expire
            if first == 0 #set subs current for st object
              subsCurrentObj = sp
              first = 1
            else #if it stills have many purchase enable, it will get priority purchase via order_number
              if subsCurrentObj[:order_number].to_i > sp.order_number.to_i
                subsCurrentObj = sp
              end
            end
          end #end check expire date
        end #end loop
      end #end check expire date


      #add to current list
      subsCurrent << subsCurrentObj

      subsCurrent.each do |sp|
        #just get one item frist
        info[:id] = sp.subID
        info[:description] = sp.description
        info[:created_date] = sp.created_date
        info[:name] = sp.name
        info[:price] = sp.price
        info[:period] = sp.period
        info[:subs_type] = sp.subs_type
        info[:transaction_id] = sp.transaction_id
        info[:purchase_type] = sp.purchase_type
        info[:purchase_status] = sp.purchase_status
        info[:today] = Time.now.to_i # get current date in server for client check expire time
        #get detail info
        # used = SubPurchase.get_used_value(user)
        info[:components] = SubDetail.get_subs_detail(sp.subID, used, nuber3rd)

        #reset flag current purchase
        SubPurchase.reset_current_purchase(user.id)
        #set current purchase
        curpur = SubPurchase.find(sp.id)
        curpur.is_current = 1
        curpur.save

        break
      end
    else #free account
      #get free account info
      sub_free = SubDetail.getFreeAccount()

      info[:id] = sub_free[:subID]
      info[:description] = sub_free[:description]
      info[:created_date] = user.created_date #date of user registered
      info[:name] = sub_free[:name]
      info[:price] = sub_free[:price]
      info[:period] = sub_free[:period]
      info[:subs_type] = sub_free[:subs_type]
      # info[:transaction_id] = sub_free[:transaction_id]
      # info[:purchase_type] = sub_free[:purchase_type]
      # info[:purchase_status] = sub_free[:purchase_status]
      info[:today] = Time.now.to_i # get current date in server for client check expire time

      # used = SubPurchase.get_used_value(user)
      info[:components] = SubDetail.get_subs_detail(sub_free[:subID], used, nuber3rd)
    end
    return info
  end
  # rubocop:enable Metrics/MethodLength

  def self.reset_current_purchase(user_id)
    sql = " UPDATE subscription_purchase SET is_current = 0 WHERE user_id = "
    sql << user_id.to_s
    connection.execute(sql)
  end

  def self.get_subs_purchase(user_id)
    sql = " SELECT sp.*, su.name, su.price, su.period, su.subs_type FROM subscription_purchase sp "
    sql << " LEFT JOIN subscriptions su on su.id = sp.subID "
    sql << " WHERE sp.user_id = :user_id"
    sql << " ORDER BY sp.id DESC "

    info = {}
    subsPerchase = SubPurchase.find_by_sql([sql, { user_id: user_id }])
    if subsPerchase and subsPerchase.length > 0
      subsPerchase.each do |sp|
        #just get one item frist
        info[:subID] = sp.subID
        info[:description] = sp.description
        info[:created_date] = sp.created_date
        info[:name] = sp.name
        info[:price] = sp.price
        info[:period] = sp.period
        info[:subs_type] = sp.subs_type
        #get detail info
        info[:details] = SubDetail.get_subs_detail(sp.subID)
        break
      end
    end
    return info
  end

  #check and apply the logic if user upgrade subscription higher current
  def self.check_to_apply_subs_higher(user_id, newSubsPurchase)
    #get current purchase
    currentPurchase = SubPurchase.where(user_id: user_id, is_current: 1).first
    #compare with new subscription
    if currentPurchase
      currentSubs = Subscription.where(id: currentPurchase.subID).first

      newCurrentSubs = Subscription.where(id: newSubsPurchase.subID).first
      #if higher, will update new subscription purchase
      if newCurrentSubs.order_number.to_i < currentSubs.order_number.to_i
        #reset flag current purchase
        SubPurchase.reset_current_purchase(user_id)
        #update new subs
        newSubsPurchase.is_current = 1
        newSubsPurchase.save
      end
    end
  end

  #get IMAP/FILE total size of user
  def self.get_total_folders_size(user_id, path)
    #get files in folder and children folders
    p = path
    if path.to_s == IMAP_FOLDER_PATH.to_s
      user = User.find(user_id)
      email = user.email.split("@")
      p = p +  email[0].to_s + "/**/*"
    else #file path
      p = p + user_id.to_s + "/**/*"
    end
    fp = Dir[p]
    total = 0
    if fp.length > 0
      fp.each do |it|
        if !File.directory?(it) #check file type
          fs = File.size(it)
          total = total + fs #sum size files of folder
        end
      end
    end
    return total
  end

  #get used value
  def self.get_used_value(user)
    user_id = user.id
    #get all caldav size
    caldav = CalendarObject.get_total_size_caldav(user.email)
    caldavSize = caldav[0][:total]
    #get all carddav size
    carddav = Cards.get_total_size_carddav(user.email)
    carddavSize = carddav[0][:total]
    # total IMAP folder
    imapSize = SubPurchase.get_total_folders_size(user_id, IMAP_FOLDER_PATH)
    # total file size
    fileSize = SubPurchase.get_total_folders_size(user_id, FILES_FOLDER_PATH)
    #total
    # info[:caldav_size] = caldavSize
    # info[:carddav_size] = carddavSize
    # info[:imap_size] = imapSize
    # info[:file_size] = fileSize
    used = 0
    used = caldavSize.to_i + carddavSize.to_i + imapSize.to_i + fileSize.to_i
    return used
  end

  #auto upgrade Premium yearly for beta user
  #https://www.pivotaltracker.com/story/show/145493363
  def self.auto_upgrade_pre_yearly(user_id)
    objPromotion = AdminPromotion.first
    #if admin has allow system auto upgrade new user to Premium yearly
    if objPromotion and objPromotion.allow_pre_signup.to_i == 1
      obj = SubPurchase.new()
      #get default pre yearly
      subs = Subscription.all
      subs.each do |s|
        if s.order_number.to_i == 3 #premium yearly
          obj.subID = s.id
          break
        end
      end
      #set to object
      obj.user_id = user_id
      obj.purchase_status = 1
      obj.is_current = 1
      obj.save
    end
  end

  private

  def defaults
    self.receipt_data ||= ""
  end

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
  end
end
