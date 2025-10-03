# class Api::Web::DelitemsController < Api::Web::BaseController
  # EXCEPT_FIELDS = [:user_id]

  # def index
    # respond_list = Array.new
    # sql = "user_id = :user_id"
    # conditions = {:user_id => @user_id}

    # if params[:modifiedGTE] #get data - greater than or equal
      # sql << ' AND updated_date >= :updated_date'
      # conditions[:updated_date] = params[:modifiedGTE]
    # end

    # if params[:modifiedLT] #get data before - less than
      # sql << ' AND updated_date < :updated_date'
      # conditions[:updated_date] = params[:modifiedLT]
    # end

    # ids = params[:ids]
    # if ids and ids.length > 0
      # sql << ' AND id IN(:ids)'
      # conditions[:ids] = ids.split(',')
    # end
    
    # itype = params[:itype]
    # if itype
      # itype = itype.to_s.upcase
      # sql << ' AND item_type IN(:itype)'
      # conditions[:itype] = itype
    # end

    # lnks = DeletedItem.where([sql, conditions])
    # lnks = lnks.order('updated_date asc')

    # field = params[:fields]
    # if field and field.length > 0
      # #auto remove field if it does not have field name
      # arr = field.split(',')
      # f = Array.new
      # arr.each do |a|
        # f << a if DeletedItem.column_names.include?(a.to_s)
      # end
      # lnks = lnks.select(f)
    # end

    # respond_list = lnks
    
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
    # end
  # end
# end
