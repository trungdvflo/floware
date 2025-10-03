class Api::AddressbookController < Api::BaseController
  EXCEPT_FIELDS = [:user_id]

  #get info
  def index
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    email = current_user_id.email
    principal = API_PRINCIPAL.to_s + email.to_s
    #respond
    respond_list = Array.new()
    sql = "principaluri = :principaluri"
    conditions = {:principaluri => principal}
    # if params[:modifiedGTE] #get data - greater than or equal
      # sql << ' AND updated_date >= :updated_date'
      # conditions[:updated_date] = params[:modifiedGTE]
    # end
    # if params[:modifiedLT] #get data before - less than
      # sql << ' AND updated_date < :updated_date'
      # conditions[:updated_date] = params[:modifiedLT]
    # end
    ids = params[:ids]
    if ids and ids.length > 0
      sql << ' AND id IN(:ids)'
      conditions[:ids] = ids.split(',')
    end

    if params[:minID]
      sql << ' AND id > :min_id'
      conditions[:min_id] = params[:minID]
    end

    cols = Addressbook.where([sql, conditions])

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
        f << a if Addressbook.fields.include?(a.to_s)
      end
      cols = cols.select(f)
    end
    #get collection data
    respond_list = cols
    respond_to do |format|
      format.xml {render :xml => respond_list.to_xml(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS)}
      format.json {render :json => respond_list.to_json(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS)}
    end
  end

  #get info
  def contacts
    pItem = params[:pItem] #the number item of page, ex: 100 items/page
    pAddUri = params[:ad_uri]

    @respond_list = []

    user_id = current_user_id.user_id if current_user_id
    email = current_user_id.email
    principal = API_PRINCIPAL.to_s + email.to_s

    pItem = pItem ? pItem : 0
    pNumber = pNumber ? pNumber : 0
    # pAddUri = (pAddUri  and pAddUri.to_s.length > 0) ? pAddUri : ''
    pAddUri = pAddUri.present? ? pAddUri : ''
    arrUri = Addressbook.uris(principal, pItem, pAddUri, params[:minID].to_i)

    if pAddUri and pAddUri.length > 0 # get cards by addressbook uri
      contacts = []
      arrUri.each do |uri|
        contacts << { :href => uri[:ca_uri], id: uri[:id] }
      end
      @respond_list << { contacts: contacts}
    elsif arrUri and arrUri.length > 0
      groupedUri = arrUri.group_by {|addUri| addUri[:ad_uri]}
      groupedUri.keys.each do |key|
        card_hrefs = Array.new()
        groupedUri[key].each do |uri|
          card_hrefs << { :href => uri[:ca_uri], id: uri[:id] }
        end
        @respond_list << {
          :addressbook_uri => key,
          :contacts => card_hrefs
        }
      end
    end
  end

  #get URI of addressbook and card, just support for app
  def addressbook
    pItem = params[:pItem] #the number item of page, ex: 100 items/page
    pNumber = params[:pNumber] #the page number, ex: page 2 or page 3 or page 4
    pAddUri = params[:ad_uri]


    #respond
    respond_list = Array.new()
    user_id = current_user_id.user_id if current_user_id
    email = current_user_id.email
    principal = API_PRINCIPAL.to_s + email.to_s

    pItem = pItem ? pItem : 0
    pNumber = pNumber ? pNumber : 0
    pAddUri = pAddUri.present? ? pAddUri : ''
    arrUri = Addressbook.getURI(principal, pItem, pNumber, pAddUri)

    if pAddUri and pAddUri.length > 0 # get cards by addressbook uri
      respond_list = {
        :contacts => []
      }
      arrUri.each do |uri|
        respond_list[:contacts] << { :href => uri[:ca_uri]}
      end
    elsif arrUri and arrUri.length > 0
      respond_list = Array.new()
      groupedUri = arrUri.group_by {|addUri| addUri[:ad_uri]}
      groupedUri.keys.each do |key|
        card_hrefs = Array.new()
        groupedUri[key].each do |uri|
          card_hrefs << { :href => uri[:ca_uri]}
        end
        respond_list << {
          :addressbook_uri => key,
          :contacts => card_hrefs
        }
      end
    end
    respond_to do |format|
      format.xml {render :xml => respond_list.to_xml(:except => EXCEPT_FIELDS)}
      format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
    end
  end

  ##############################################
  # add: 11 apr 2016
  #support for Flo Mac and Flo iOS get href
  def getChanges
    pItem = params[:pItem] #the number item of page, ex: 100 items/page
    pNumber = params[:pNumber] #the page number, ex: page 2 or page 3 or page 4
    pAddUri = params[:ad_uri] #uri of address book
    syncToken = params[:syncTk] #sycn token of Object
    min_id = params[:minID]

    #format res = {"error" => :errorCode, "data" => [{}, {},...]}
    res = {:error => API_ITEM_NO_URI, :description => "Address book URI or sync token invalid"}
    if pAddUri and (pAddUri.to_s.strip != '') and syncToken and (syncToken.to_s.strip != '')
      # get address uri changes
      user_id = current_user_id.user_id if current_user_id
      email = current_user_id.email
      principal = API_PRINCIPAL.to_s + email.to_s

      pItem = pItem ? pItem : 0
      pNumber = pNumber ? pNumber : 0
      pAddUri = pAddUri.present? ? pAddUri : ''
      min_id = min_id ? min_id : 0
      arrUri = Addressbook.getChangesURI(principal, pItem, pNumber, pAddUri, syncToken, min_id)

      res = {:data => arrUri}

    end
    respond_to do |format|
      format.json {render :json => res.to_json(:root => API_CONTACT,:except => EXCEPT_FIELDS)}
    end
  end
  ##############################################

  #create
  def create
    #parameters
    cols = params.permit![API_PARAMS_JSON]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    email = current_user_id.email
    principal = API_PRINCIPAL.to_s + email.to_s
    #respond
    respond_list = Array.new()

    if cols.present?
      if cols.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      cols.each do |col|
        begin
          col.delete(:id)
          cl = Addressbook.new(col.permit!)
          cl.principaluri = principal
          if cl.save
            respond_list << cl
          else
            respond_list << { error: API_ITEM_CANNOT_SAVE, attributes: col, description: MSG_ERR_NOT_SAVED }
          end
        rescue
          respond_list << { error: API_ITEM_CANNOT_SAVE, attributes: col, description: MSG_ERR_NOT_SAVED }
        end
      end
    end
    respond_to do |format|
      format.xml {render :xml => respond_list.to_xml(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS, :methods => :ref)}
      format.json {render :json => respond_list.to_json(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS, :methods => :ref)}
    end
  end

  #update
  def update
    #parameters
    cols = params.permit![API_PARAMS_JSON]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    email = current_user_id.email
    principal = API_PRINCIPAL.to_s + email.to_s
    #respond
    respond_list = Array.new()

    if cols and cols.length > 0
      if cols.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      cols.each do |col|
        id = col[:id]
        next if !id
        cl = Addressbook.find_by(principaluri: principal, id: id)
        if cl
          col.delete(:id)
          if cl.update_attributes(col.permit!)
            respond_list << cl
          else
            respond_list << { error: API_ITEM_CANNOT_SAVE, attributes: col, description: MSG_ERR_NOT_SAVED }
          end
        else
          respond_list << { error: API_ITEM_CANNOT_SAVE, attributes: col, description: MSG_ERR_NOT_SAVED }
        end
      end
    end

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS)}
    end
  end

  #delete
  def destroy
    #parameters
    ids = params[:id]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    email = current_user_id.email
    principal = API_PRINCIPAL.to_s + email.to_s
    #respond
    respond_list = Array.new()
    if ids and ids.length > 0
      arrids = ids.split(',')
      if arrids and arrids.length > 0
        res = ""
        arrids.each do |id|
          res = res + id.to_s.strip + ',' if id.to_s.strip != ''
        end
        begin
          #delete Tracking
          Addressbook.delete_all_addressbook(principal, res.to_s.chop) if res != ''
          respond_list << {:success => API_SUCCESS, :description => MSG_DELETE_SUCCESS}
        rescue
          respond_list << {:error => ids, :description => MSG_DELETE_FAIL}
        end
      end
    else
      respond_list << {:error => ids, :description => MSG_DELETE_FAIL}
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS)}
    end
  end
end
