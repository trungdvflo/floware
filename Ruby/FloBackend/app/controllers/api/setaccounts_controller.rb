require 'json'

class Api::SetaccountsController < Api::BaseController
  EXCEPT_FIELDS = [:user_id, :pass_income, :pass_smtp,:auth_key,:auth_token]

  def index
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id

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


    if params[:minID]
      sql << ' AND id > :min_id'
      conditions[:min_id] = params[:minID]
    end

    cols = SetAccount.where([sql, conditions])

    if params[:pItem]
      cols = cols.order('id asc')
      cols = cols.limit(params[:pItem].to_i)
    end

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

    @set_accounts = cols

    #get item deleted
    hasDataDel = params[:has_del] #check get deleted data
    if hasDataDel and hasDataDel.to_i == 1
      @set_accounts_deleted = DeletedItem.get_del_items(user_id, API_SET_3RD_ACC, params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem])
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
          #dont sync password
          col.delete(:pass_income) if col[:pass_income]
          col.delete(:pass_smtp) if col[:pass_smtp]
          #gmail
          col.delete(:auth_key) if col[:auth_key]
          col.delete(:auth_token) if col[:auth_token]

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
    # respond_to do |format|
      # format.json {render :json => res.to_json(:root => API_SET_ACC, :except => EXCEPT_FIELDS, :methods => :ref)}
    # end
  end
  # rubocop:enable Metrics/BlockLength

  # rubocop:disable Metrics/BlockLength
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
          #dont sync password
          account.delete(:pass_income) if account[:pass_income]
          account.delete(:pass_smtp) if account[:pass_smtp]
          #gmail
          account.delete(:auth_key) if account[:auth_key]
          account.delete(:auth_token) if account[:auth_token]

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
  # rubocop:enable Metrics/BlockLength

  def destroy
    @deleted_ids = []

    set_account_by_ids = SetAccount.find_by_ids(current_user_id.user_id, permit_id_params(params[:id]))
    @deleted_ids = set_account_by_ids.map(&:id)
    set_account_by_ids.delete_all

    deleted_item_service(ids: @deleted_ids).execute

    @data_error = log_ids_cannot_delete(permit_id_params(params[:id]), @deleted_ids)
  end

  private

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user_id.user_id,
                                 item_type: API_SET_3RD_ACC.to_s)
  end

  def flo_email?(email)
    email.to_s.split('@')&.last == EMAIL_MATCHER
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
