require 'json'

class Api::Web::SetaccountsController < Api::Web::BaseController
  EXCEPT_FIELDS = [:user_id]

  def index
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()
    
    sql = "user_id = :user_id"
    conditions = {:user_id => user_id}
    if params[:modifiedGTE] #get data - greater than or equal
      sql << ' AND updated_date >= :updated_date'
      conditions[:updated_date] = params[:modifiedGTE]
    end
    if params[:modifiedLT] #get data before - less than
      sql << ' AND updated_date < :updated_date'
      conditions[:updated_date] = params[:modifiedLT]
    end
    ids = params[:ids]
    if ids and ids.length > 0
      sql << ' AND id IN(:ids)'
      conditions[:ids] = ids.split(',')
    end
    cols = SetAccount.where([sql, conditions])
    field = params[:fields]
    if field and field.length > 0
      #auto remove field if it does not have field name
      arr = field.split(',')
      f = Array.new()
      arr.each do |a|
        f << a if SetAccount.fields.include?(a.to_s)
      end
      cols = cols.select(f)
    end
    #get setting account data
    respond_list = cols
    
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_SET_ACC, :except => EXCEPT_FIELDS)}
    end
  end

  # rubocop:disable Metrics/BlockLength
  def create
    #parameters
    cols = params[API_SET_ACC] || params[API_PARAMS_JSON]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    data = Array.new()
    data_err = Array.new()


    if cols and cols.length > 0
      if cols.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      cols.each do |col|
        if flo_email_valid?(col) && other_account?(col['account_type'])
          data_err << { error: CAN_NOT_ADD_THIRD_PARTY,
                        description: MSG_CAN_NOT_ADD_THIRD_PARTY,
                        attributes: col }
          next
        end

        if col[:account_sync].nil?
          col[:account_sync] = '{"Email":1,"Calendar":1}'
        elsif col[:account_sync].present? and valid_json? col[:account_sync].to_json
          col[:account_sync] = col[:account_sync].to_json
        else
          data_err << { error: API_ITEM_CANNOT_SAVE,
                        description: 'Account sync invalid',
                        attributes: col }
          next
        end

        begin

          user = User.where(id: user_id).first
          cl = SetAccount.where(user_id: user_id, account_type: col["account_type"] , server_income: col["server_income"], user_income: col["user_income"]).first
          if cl.blank?
            cl = SetAccount.new(col.permit!.except(:id))
            cl.user_id = user_id
          else
            cl.assign_attributes(col.permit!)
          end

          if cl.save
            #send mail to 3rd account when added
            email_3rd = col[:user_income]
            flo_email = user ? user.email : ''
            Thread.new do
              SetAccount.send_mail_to_3rd_account(email_3rd, flo_email)
            end
            data << cl
          else
            data_err << { error: API_ITEM_CANNOT_SAVE,
                          description: cl.errors.full_messages.join(','),
                          attributes: col }
          end
        rescue
          data_err << { error: API_ITEM_CANNOT_SAVE,
                        description: MSG_ERR_NOT_SAVED,
                        attributes: col }
        end
      end
    end

    # res = {:data => data}
    # res[:data_error] = data_err if data_err and data_err.length > 0

    @set_accounts = data
    @set_accounts_errors = data_err
  end
  # rubocop:enable Metrics/BlockLength

  def update
    accounts = params[API_SET_ACC] || params[API_PARAMS_JSON]

    data = Array.new()
    data_err = Array.new()


    if accounts.present?
      if accounts.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      accounts.each do |account|
        id = account[:id]
        next if !id

        account.delete_if { |key| SetAccount.fields.exclude?(key) }

        if flo_email_valid?(account) && other_account?(account['account_type'])
          data_err << { error: CAN_NOT_ADD_THIRD_PARTY,
                        description: MSG_CAN_NOT_ADD_THIRD_PARTY,
                        attributes: account }
          next
        end
        found = SetAccount.find_by(user_id: @user_id, id: id)
        if found
          account.delete(:id)

          if valid_json? account[:account_sync].to_json
            account[:account_sync] = account[:account_sync].to_json
          end

          begin
            if found.update_attributes(account.permit!)
              data << found
            else
              data_err << { error: API_ITEM_CANNOT_SAVE,
                            description: found.errors.full_messages.join(',') || MSG_ERR_NOT_SAVED,
                            attributes: account }
            end
          rescue
            data_err << { error: API_ITEM_CANNOT_SAVE,
                          description: MSG_ERR_NOT_SAVED,
                          attributes: account }
          end
        else
          data_err << { error: API_ITEM_NOT_EXIST,
                        description: MSG_ERR_NOT_EXIST,
                        attributes: account }
        end
      end
    end

    @set_accounts = data
    @set_accounts_errors = data_err
  end

  def destroy
    #parameters
    ids = params[:id]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()
    if ids and ids.length > 0
      arrids = ids.split(',')
      if arrids and arrids.length > 0
        res = ""
        arrids.each do |id|
          res = res + id.to_s.strip + ',' if id.to_s.strip != ''

          if id and id.to_s.strip.length > 0
            # save deleted items
            delLnk = DeletedItem.new()
            delLnk.item_type = API_SET_3RD_ACC.to_s
            delLnk.user_id = user_id
            delLnk.item_id = id
            delLnk.save
          end

        end
        begin
          #delete canvas
          SetAccount.delete_all_set_accounts(user_id, res.to_s.chop) if res != ''
          respond_list << {:success => API_SUCCESS,:ids => res, :description => MSG_DELETE_SUCCESS}
        rescue
          respond_list << {:error => ids, :description => MSG_DELETE_FAIL}
        end
      end
    else
      respond_list << {:error => ids, :description => MSG_DELETE_FAIL}
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_SET_ACC, :except => EXCEPT_FIELDS)}
    end
  end

  private

  def flo_email?(email)
    email&.split('@')&.last == EMAIL_MATCHER
  end

  def flo_email_valid?(col)
    flo_email?(col['user_income']) || flo_email?(col['user_smtp']) || flo_email?(col['user_caldav'])
  end

  def other_account?(account_type)
    account_type == SetAccount::ACCOUNT_TYPE_OTHER_ACCOUNT ||
      account_type == SetAccount::ACCOUNT_TYPE_OTHER_CALDAV ||
      account_type == SetAccount::ACCOUNT_TYPE_OTHER_EMAIL
  end

  def valid_json?(json)
    JSON.parse(json)
    true
  rescue
    false
  end
end
