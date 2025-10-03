class Api::Web::SubscriptionController < Api::Web::BaseController
  EXCEPT_FIELDS = [:user_id]
  
  #get info setting
  # def index
    # #parameters
    # #default = get current purchase 
    # subscriptions = params[:subs] #get all list subscriptions
    # components = params[:comps] #get all list components
    # details = params[:details] # get detail all subscriptions
    # his_purs = params[:hispur] # get all history purchase
    # cur_purs = params[:curpur] # get current purchase of user
    # substructure = params[:substructure] # get current purchase of user
    
    # user_id = 0
    # user_id = current_user_id.user_id if current_user_id
    # #respond
    # respond_list = Array.new()
    # isCurrent = 1
    
    # user = User.find(user_id)
    # info = {}
    # if user
      # #update used for user
      # User.update_used(user.id, user.email)
        
      # #get all subscriptions 
      # if subscriptions and subscriptions.to_i == 1
        # info[:subscriptions] = Subscription.get_subscriptions()
        # isCurrent = 0
      # end
      # #get all components 
      # if components and components.to_i == 1
        # info[:components] = SubComponent.get_components()
        # isCurrent = 0
      # end
      # #get all subscription details
      # if details and details.to_i == 1
        # info[:subs_details] = SubDetail.get_subscriptions_details()
        # isCurrent = 0
      # end
      # #get all history purchase of the user 
      # if his_purs and his_purs.to_i == 1
        # info[:subs_his_purs] = SubPurchase.get_subs_purchase_history(user_id)
        # isCurrent = 0
      # end
      
      # #substructure
      # if substructure and substructure.to_i == 1
        # info[:subscriptions] = Subscription.get_subs_by_structure()
        # isCurrent = 0
      # end
      
      # #get current purchase of the user 
      # if (cur_purs and cur_purs.to_i == 1) or (isCurrent.to_i == 1)
        # info[:subscription] = SubPurchase.get_subs_current_purchase(user)
      # end
      
    # end #end of user check
    # respond_list = info
    
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:root => API_SUBSCRIPTON, :except => EXCEPT_FIELDS)}
    # end
  # end
  
  # rubocop:disable Metrics/MethodLength
  # def create
    # #parameters
    # subs = params[API_SUBSCRIPTON] || params[API_PARAMS_JSON]
    # user_id = 0
    # user_id = current_user_id.user_id if current_user_id
    # #upgrade with sandbox (test), default is production
    # sandbox = params[:sb] ? params[:sb] : 0
    # hasError = 0
    # #respond
    # respond_list = Array.new()
    
    # if subs
      # info = {}
      # sp = SubPurchase.new()
      # sp.user_id = user_id
      # sp.subID = subs[:subID] ? subs[:subID] : ''
      # sp.description = subs[:description] ? subs[:description] : ''
      # sp.purchase_type = subs[:purchase_type] ? subs[:purchase_type] : 0
      # sp.purchase_status = subs[:purchase_status] ? subs[:purchase_status] : 0
      # #check transaction valid
      # if subs[:transaction_id]
        # sp.transaction_id = subs[:transaction_id]
      # else
        # hasError = 1
        # info[:error] = API_TRANSACTION_INVALID
        # info[:message] = API_MSG_TRANSACTION_INVALIDt
      # end
      # #check receipt data valid
      # if subs[:receipt_data]
        # sp.receipt_data = subs[:receipt_data]
      # else
        # hasError = 1
        # info[:error] = API_RECEIPT_DATA_INVALID
        # info[:message] = API_MSG_RECEIPT_DATA_INVALID
      # end
      
      # #check receipt data exist
      # spReceipt = []
      # if hasError == 0
        # spReceipt = SubPurchase.where(receipt_data: sp.receipt_data)
        
        # if spReceipt and spReceipt.length > 0
          # #existed, need to return error
          # info[:error] = API_RECEIPT_DATA_EXISTED
          # info[:message] = API_MSG_RECEIPT_DATA_EXISTED
        # else
          # #verify receipt_data with Apple, if it is OK, will save transaction to DB, it's unique
          # #call to check with Apple here
          # url = API_PATH_SUBS_BUY.to_s
          # if sandbox and sandbox.to_i == 1 #for test
            # url = API_PATH_SUBS_SANDBOX.to_s
          # end
          
          # body = {
              # "receipt-data" => sp.receipt_data,
              # "password" => API_SUBS_PASS_VERIFY.to_s
          # }.to_json
          
          # res = RestClient.post url, body, {content_type: :json, accept: :json}
          # resObj = JSON.parse(res)
          # stt = resObj['status'] ? resObj['status'] : -1 
          # if stt.to_i == 0 #verify OK
            # if sp.save
              # info[:description] = sp.description
              # info[:subID] = sp.subID
              # info[:created_date] = sp.created_date
              # info[:purchase_type] = sp.purchase_type
              # info[:purchase_status] = sp.purchase_status
              # info[:transaction_id] = sp.transaction_id
              # info[:receipt_data] = sp.receipt_data
            # end #end save data into DB
          # else
            # info[:error] = API_RECEIPT_DATA_FAILED
            # info[:message] = API_MSG_RECEIPT_DATA_FAILED
            # info[:status] = stt if stt
          # end
        # end
      # end
      
      # respond_list = info
      
    # end
    
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:root => API_SUBSCRIPTON, :except => EXCEPT_FIELDS)}
    # end
  # end
  # rubocop:enable Metrics/MethodLength
end
