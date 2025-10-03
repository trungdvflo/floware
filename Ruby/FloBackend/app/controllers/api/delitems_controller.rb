class Api::DelitemsController < Api::BaseController
  EXCEPT_FIELDS = [:user_id]

  def index
    respond_list = Array.new
    sql = "user_id = :user_id"
    conditions = {:user_id => @user_id}

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
    
    itype = params[:itype]
    if itype
      itype = itype.to_s.upcase
      sql << ' AND item_type IN(:itype)'
      conditions[:itype] = itype
    end

    if params[:minID]
      sql << ' AND id > :min_id'
      conditions[:min_id] = params[:minID] 
    end
    
    lnks = DeletedItem.where([sql, conditions])
    
    if params[:pItem]
      lnks = lnks.order('id asc')
      lnks = lnks.limit(params[:pItem].to_i)
    else
      lnks = lnks.order('updated_date asc')
    end

    field = params[:fields]
    if field and field.length > 0
      #auto remove field if it does not have field name
      arr = field.split(',')
      f = Array.new
      arr.each do |a|
        f << a if DeletedItem.column_names.include?(a.to_s)
      end
      lnks = lnks.select(f)
    end

    # respond_list = lnks
    
    #response dictionary
    res = {:data => lnks}
    
    respond_to do |format|
      format.xml {render :xml => res.to_xml(:except => EXCEPT_FIELDS)}
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
    end
  end
end
