class Api::UrlsController < Api::BaseController
  require 'net/http'
  require 'uri'
  EXCEPT_FIELDS = [:user_id]

  #get info
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

    if params[:minID]
      sql << ' AND id > :min_id'
      conditions[:min_id] = params[:minID]
    end

    urls = Url.where([sql, conditions])

    if params[:pItem]
      urls = urls.order('id asc')
      urls = urls.limit(params[:pItem].to_i)
    else
      urls = urls.order('updated_date asc')
    end

    field = params[:fields]
    if field and field.length > 0
      #auto remove field if it does not have field name
      arr = field.split(',')
      f = Array.new
      arr.each do |a|
        f << a if Url.fields.include?(a.to_s)
      end
      urls = urls.select(f)
    end
    # respond_list << {:data => urls}
    res = {:data => urls}

    #get deleted items
    hasDataDel = params[:has_del] #check get deleted data
    if hasDataDel and hasDataDel.to_i == 1
      #deleted items
      objsDel = Array.new()
      objsDel = DeletedItem.get_del_items(@user_id, API_URL.to_s , params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem])
      res[:data_del] = objsDel
    end

    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
    end
  end

  # rubocop:disable Style/For
  def create
    urls = params[API_URLS] || params[API_PARAMS_JSON]
    respond_list = Array.new()

    data = Array.new()
    data_err = Array.new()

    if urls and urls.length > 0
      if urls.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      for i in 0..(urls.length-1)
        begin
          urls[i].delete(:id)
          ul = Url.new(urls[i].permit!)
          ul.user_id = @user_id
          ul.title = urls[i][:title] || ''
          max = Url.where(user_id: @user_id).maximum(:order_number) || 0
          ul.order_number = max.to_i + 1

          if ul.save
            data << ul
          else
            data_err << { error: API_ITEM_CANNOT_SAVE, attributes: urls[i], description: ul.errors.full_messages.join(',') }
          end
        rescue
          data_err << { error: API_ITEM_CANNOT_SAVE, attributes: urls[i], description: MSG_ERR_NOT_SAVED }
        end
      end
    end

    #response dictionary
    res = {:data => data}
    res[:data_error] = data_err if data_err and data_err.length > 0

    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS, :methods => :ref)}
    end
  end
  # rubocop:enable Style/For

  #update
  def update
    urls = params[API_URLS] || params[API_PARAMS_JSON]
    respond_list = Array.new()

    data = Array.new()
    data_err = Array.new()

    if urls and urls.length > 0
      if urls.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      urls.each do |url|
        id = url[:id]
        next if !id
        ul = Url.find_by(user_id: @user_id, id: id)
        if ul
          url.delete(:id)
          if ul.update_attributes(url.permit!)
            data << ul
          else
            data_err << { error: API_ITEM_CANNOT_SAVE, attributes: urls, description: MSG_ERR_NOT_SAVED }
          end
        else
          data_err << { error: API_ITEM_CANNOT_SAVE, attributes: urls, description: MSG_ERR_NOT_SAVED }
        end
      end
    end

    #response dictionary
    res = {:data => data}
    res[:data_error] = data_err if data_err and data_err.length > 0

    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
    end
  end

  def destroy
    super
  end

  # rubocop:disable Metrics/MethodLength
  def get_bookmarks_of_col
    collection_id = params[:collection_id]
    if collection_id.blank?
      respond_list = ""
      respond_to do |format|
        format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
      end
      return
    end
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

    # TODO: replace if update to rails 3.2 *update*
    ids  = []
    ids << Link
        .where("user_id = ? and source_type = 'URL' and destination_type = 'FOLDER' and destination_id = ?", @user_id, collection_id)
        .select(:source_id).map{|r| r.source_id}
    ids << Link
         .where("user_id = ? and destination_type = 'URL' and source_type = 'FOLDER' and source_id = ?", @user_id, collection_id)
         .select(:destination_id).map{|r| r.destination_id}
    ids = ids.flatten

    if ids and ids.length > 0
      sql << ' AND id IN(:ids)'
      conditions[:ids] = ids
    end

    urls = Url.where([sql, conditions])
    urls = urls.order('updated_date desc')

    # filter by trash
    if !params[:include_trash]
      trash = Trash
                  .where({ user_id: @user_id })
                  .select { |t| t.obj_type == 'URL' }
                  .map { |t| t.obj_id }
      urls = urls.where('id not in (?)', trash) if trash and trash.length > 0
    end

    if params[:cur_items] && params[:next_items]
      if params[:cur_items].to_i == 0
        urls = urls.limit(params[:next_items])
      else
        urls = urls.limit(params[:next_items]).offset(params[:cur_items].to_i)
      end
    end

    # check default url has order_number = 0
    # add new order based on maximum value of order_number
    if urls.length > 0
      urls = mapNewOrder(urls) || Array.new
    end

    field = params[:fields]
    if field and field.length > 0
      #auto remove field if it does not have field name
      arr = field.split(',')
      f = Array.new
      arr.each do |a|
        f << a if Url.fields.include?(a.to_s)
      end
      urls = urls.select(f)
    end

    # convert urls to hash to remove root url
    # set include_root_in_json = false will affect the app api
    urls = convertUrls(urls)

    hasDataDel = params[:has_del] #check get deleted data
    if hasDataDel and hasDataDel.to_i == 1
      respond_list << {:data => urls}
      #deleted items
      objsDel = Array.new()
      objsDel = DeletedItem.get_del_items(@user_id, API_URL.to_s , params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem])
      respond_list << {:data_del => objsDel}
    else #get data by version 1
      respond_list = urls
    end

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
    end
  end
  # rubocop:enable Metrics/MethodLength

  def get_import  
    respond_list = [] 
    urls = Url.get_import_urls(@user_id)
    urls = convertUrls(urls)
    respond_to do |format|
      format.json {render :json => urls}
    end
  end

  def search_url
    query = params[:qs]
    data = []

    if query.present?
      data.concat(__search_url(query))
    end

    data = {"items" => data, "search_term" => query}
    respond_to do |format|
      format.json {render :json => data.to_json()}
    end
  end

  private

  def delete(ids)
    deleted_ids = []

    url_by_ids = Url.find_by_ids(current_user_id.user_id, permit_id_params(ids))
    deleted_ids = url_by_ids.map(&:id)
    url_by_ids.delete_all
    deleted_item_service(ids: deleted_ids).execute

    deleted_ids
  end

  def recover(re_ids)
    deleted_ids = []

    url_by_ids = Url.find_by_ids(current_user_id.user_id, permit_id_params(re_ids))
    deleted_ids = url_by_ids.map(&:id)
    deleted_item_service(ids: deleted_ids, is_recovery: 1).execute

    deleted_ids
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user_id.user_id,
                                 item_type: API_URL.to_s,
                                 is_recovery: hash_param[:is_recovery])
  end

  def convertUrls(urls)
    urls.map{ |x| x.attributes }.each{ |x| x['uid'] = x['id'] }
  end

  def collectDuplicateOrderNumber(urls)
    urls.sort_by {|url| url.order_number}
    $duplicateItems = Array.new
    $i = 0
    # find duplicate Url based on order_number fields
    if urls.length > 1
      while $i < urls.length
        $j = $i + 1 if $i < urls.length - 1
        if urls[$i].order_number == urls[$j].order_number
          $duplicateItems << urls[$i]
        end
        $i+=1
      end 

      if $duplicateItems.length > 0 
        $duplicateItems = setNewOrder($duplicateItems)
      end
    end
    
    $duplicateItems
  end

  def setNewOrder (items)
    maxOrder = items.max_by(&:order_number).order_number
    # increase the number of order_number based on maximum order_number value    
    $i = 0
    # begin loop from maxOrder + 1 
    $begin = maxOrder + 1

    while $begin < items.length + maxOrder + 1
      items[$i].order_number = $begin
      $i+=1
      $begin+=1
    end

    items
  end

  def mapNewOrder (urls)
    # duplicateUrlOrder = Array.new
    duplicateUrlOrder = collectDuplicateOrderNumber(urls) || Array.new
    # map url with duplicateUrlOrder
    if duplicateUrlOrder.length > 0
      urls.each do |url|
        duplicateUrlOrder.each do |dupUrl|
          if url.id == dupUrl.id
            url.order_number = dupUrl.order_number
            # break
            # open when check don't error get (For improvement url)
          end
        end
      end
    end
    urls
  end

  def __search_url(qs)
    data = []
    Url.where('user_id = ? AND (url like ? or (LOWER(title) like ? or LOWER(title) like ?))', 
              @user_id, '%' + qs + '%', qs + '%', '% ' + qs + '%')
        .map do |x|
          bm = {} 

          bm["id"] = x[:id]
          bm["uid"] = x[:id]
          bm["created_date"] = x[:created_date]
          bm["url"] = x[:url]
          bm["title"] = x[:title]
          bm["itemType"] = "URL"
          bm["type"] = "URL"
          data.push(bm)
        end
    data
  end
end
