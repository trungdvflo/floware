class Api::Web::AddressbookController < Api::Web::BaseController
  EXCEPT_FIELDS = [:user_id]

  # def index
    # user_id = 0
    # user_id = current_user_id.user_id if current_user_id
    # email = current_user_id.email
    # principal = API_PRINCIPAL.to_s + email.to_s
    # #respond
    # respond_list = Array.new()
    # sql = "principaluri = :principaluri"
    # conditions = {:principaluri => principal}
    # ids = params[:ids]
    # if ids and ids.length > 0 sql << ' AND id IN(:ids)'
      # conditions[:ids] = ids.split(',')
    # end
    # cols = Addressbook.where([sql, conditions])
    # field = params[:fields]
    # if field and field.length > 0
      # #auto remove field if it does not have field name
      # arr = field.split(',')
      # f = Array.new()
      # arr.each do |a|
        # f << a if Addressbook.fields.include?(a.to_s)
      # end
      # cols = cols.select(f)
    # end
    # #get collection data
    # respond_list = cols
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS)}
    # end
  # end
  
  # def create
    # cols = params[API_ADDRESSBOOK] || params[API_PARAMS_JSON]
    # user_id = 0
    # user_id = current_user_id.user_id if current_user_id
    # email = current_user_id.email
    # principal = API_PRINCIPAL.to_s + email.to_s
    # count = 0
    # #respond
    # respond_list = Array.new()
    # if cols and cols.length > 0
      # cols.each do |col|
        # begin
          # cl = Addressbook.new(col.permit!)
          # cl.principaluri = principal
          # if cl.save
            # respond_list << cl
          # else
            # respond_list << {:error => cl[:principal], :description => MSG_ERR_INVALID}
          # end
        # rescue
          # respond_list << {:error => count, :description => MSG_ERR_NOT_SAVED}
        # end 
        # #check if it greater than 50 items
        # break if count == API_MAX_RECORD
        # count = count + 1
      # end
    # end
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS, :methods => :ref)}
    # end
  # end
  
  # def update
    # cols = params[API_ADDRESSBOOK] || params[API_PARAMS_JSON]
    # user_id = 0
    # user_id = current_user_id.user_id if current_user_id
    # email = current_user_id.email
    # principal = API_PRINCIPAL.to_s + email.to_s
    # count = 0
    # #respond
    # respond_list = Array.new()
    # if cols and cols.length > 0
      # cols.each do |col|
        # id = col[:id]
        # next if !id
        # cl = Addressbook.find_by(principaluri: principal, id: id)
        # if cl
          # col.delete(:id)
          # if cl.update_attributes(col.permit!)
            # respond_list << cl
          # else
            # respond_list << {:error => cl.errors}
          # end
        # else
          # respond_list << {:error => "#{id}"} #does not exist.
        # end 
        # #check if it greater than 50 items
        # break if count == API_MAX_RECORD
        # count = count + 1
      # end
    # end
    
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS)}
    # end
  # end
  
  # def destroy
    # ids = params[:id]
    # user_id = 0
    # user_id = current_user_id.user_id if current_user_id
    # email = current_user_id.email
    # principal = API_PRINCIPAL.to_s + email.to_s
    # respond_list = Array.new()
    # if ids and ids.length > 0
      # arrids = ids.split(',')
      # if arrids and arrids.length > 0
        # res = ""
        # arrids.each do |id|
          # res = res + id.to_s.strip + ',' if id.to_s.strip != ''
        # end
        # begin
          # #delete Tracking
          # Addressbook.delete_all_addressbook(principal, res.to_s.chop) if res != ''
          # respond_list << {:success => API_SUCCESS, :description => MSG_DELETE_SUCCESS}
        # rescue
          # respond_list << {:error => ids, :description => MSG_DELETE_FAIL}
        # end
      # end
    # else
      # respond_list << {:error => ids, :description => MSG_DELETE_FAIL}
    # end
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:root => API_ADDRESSBOOK, :except => EXCEPT_FIELDS)}
    # end
  # end
end
