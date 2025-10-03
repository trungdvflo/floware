class Api::Web::UrlsController < Api::Web::BaseController
  require 'net/http'
  # require 'uri'
  require 'httparty'
  require 'nokogiri'
  require 'json'
  require 'metainspector' #refer to: https://github.com/jaimeiniesta/metainspector
  # require 'yajl/json_gem'
  # require 'benchmark'

  EXCEPT_FIELDS = [:user_id]
  
  # rubocop:disable Metrics/MethodLength
  def index
    res = {}
    # data = Array.new
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
    if ids.present?
      sql << ' AND id IN(:ids)'
      conditions[:ids] = ids.split(',')
    end

    urls = Url.where([sql, conditions])
              .order('updated_date desc')

    # default is include trash
    # filter by trash
    unless params[:include_trash]
      trash = Trash
        .where({ user_id: @user_id })
        .select { |t| t.obj_type == 'URL' }
        .map { |t| t.obj_id }
      urls = urls.where('id not in (?)', trash) if trash.present?
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
    # puts(DateTime.now.to_time)
    data = []
    # Benchmark.bm do |x|
    #   x.report("slow:") {
    #     5.times do
          if urls.present?
            urls = mapNewOrder(urls) || Array.new
          end
    #     end
    #   }
    # end
    # puts(DateTime.now.to_time)
    
    field = params[:fields]
    if field.present?
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
    # urls = convertUrls(urls)
    urls.each do |x|
      x.uid = x.id
      data << {
          x.class.model_name.element => x.serializable_hash(except: EXCEPT_FIELDS, methods: [:uid])
      }
    end

    hasDataDel = params[:has_del] #check get deleted data
    res[:data] = data
    #deleted items
    objsDel = DeletedItem.get_del_items(@user_id, API_URL.to_s , params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem]) || Array.new()
    res[:data_del] = objsDel if hasDataDel and hasDataDel.to_i == 1
    res[:data_error] = []

    respond_to do |format|
      format.json {render :json => res.to_json(except: EXCEPT_FIELDS)}
    end
  end
  # rubocop:enable Metrics/MethodLength

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

    if ids.present?
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
      urls = urls.where('id not in (?)', trash) if trash.present?
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
    if urls.present?
      urls = mapNewOrder(urls) || Array.new
    end

    field = params[:fields]
    if field.present?
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
  
  #create 
  def create
    urls = params[API_URLS] || params[API_PARAMS_JSON]
    data, data_err = [], []
    if urls.present?
      urls.each_with_index do |url_has, index|
        #parse url to get host
        url = url_has[:url]
        # cannot use URI because this unable to parse URL:PORT
        # uri = URI.parse(url)
        # uri = URI.parse("http://#{url}") if uri.scheme.nil?
        # host = uri.host.downcase
        # host.start_with?('www.') ? host[4..-1] : host
        # host = host.gsub('www.', '')
        re = /^((http|https):\/\/)?([\w-]+(\.[\w-]+)+){1,1}(:\d+)?(\/\S*)*$/
        host = re.match(url)[3]
        
        #auto get title of page
        title = host
        begin
          #get title of the site
          if !url.include? "http://" and !url.include? "https://"
            url = "http://" + url
          end
          
          page = MetaInspector.new(url)
          page_noko = HTTParty.get(url)
          html = Nokogiri::HTML(page_noko)
          title_noko = html.css('title').children.text
          if page.title.present?
            title = page.title
          elsif title_noko.present?
            title = title_noko
          end
          title = title.squish
        rescue
          data_err << { error: API_ITEM_CANNOT_SAVE, attributes: url_has, description: MSG_ERR_NOT_SAVED }
        end
        #end update auto get title of page
             
        ul = Url.new(url_has.permit!)
        ul.user_id = @user_id
        ul.title = title if url_has[:title].blank?
        max = Url.where(user_id: @user_id).maximum(:order_number) || 0
        ul.order_number = max + 1
          
        if ul.save
          ul = convertUrl(ul)
          data << ul
        else
          data_err << { error: API_ITEM_CANNOT_SAVE, attributes: url_has, description: ul.errors.full_messages.join(',') }
        end

        #check if it greater than 50 items
        break if index == API_MAX_RECORD
      end
    end

    #response dictionary
    res = {:data => data}
    res[:data_error] = data_err if data_err and data_err.length > 0
    
    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS, :methods => [:ref, :uid])}
    end
  end
  
  def update
    urls = params[API_URLS] || params[API_PARAMS_JSON]
    data, data_err = [], []

    if urls.present?
      urls.each_with_index do |url, index|
        id = url[:id]
        next if !id
        ul = Url.find_by(user_id: @user_id, id: id)
        if ul
          url.delete(:id)
          if ul.update_attributes(url.permit!)
            ul = convertUrl(ul)
            data << ul
          else
            data << {:error => ul.errors}
          end
        else
          data << {:error => "#{id}"} #does not exist.
        end 
        #check if it greater than 50 items
        break if index == API_MAX_RECORD
      end
    end
    res = {:data => data}
    res[:data_error] = data_err #if data_err and data_err.length > 0
    
    respond_to do |format|
      format.json { render json: res.to_json(:except => EXCEPT_FIELDS, methods: :uid) }
    end
  end

  def destroy
    ids = params[:id]
    #recovery id
    recovery_ids = [:re_ids]
    data, data_err, err_code = [], [], nil

    if ids.present?
      arrids = ids.gsub(/\s/, '').split(',')
      ActiveRecord::Base.transaction do
        d_items = Url.where(['user_id = ? and id in (?)', @user_id, arrids]).destroy_all
        d_items.each do |x|
          x.uid = x.id
          save_delete_item(API_URL, x.id)
        end
        if d_items.size == arrids.size
          data = d_items
        else
          arrids.each do |x|
            if d_items.pluck(:id).include?(x.to_i)
              data_err << {:success => API_SUCCESS, :ids => x, :description => MSG_ITEM_CAN_DELETE}
            else
              data_err << { error: RECORD_NOT_FOUND, description: "RECORD_NOT_FOUND".humanize, attributes: { id: x} }
              err_code = RECORD_NOT_FOUND
            end
          end
          raise ActiveRecord::Rollback
        end
      end
      
    #recovery ids
    elsif recovery_ids.present?
        arrReIds = recovery_ids.split(',')
        arrReIds.each do |id|
          res = res + id.to_s.strip + ',' if id.to_s.strip != ''
          #save deleted item canvas
          if id.to_s.strip != ''
            delLnk = DeletedItem.new()
            delLnk.item_type = API_URL.to_s
            delLnk.user_id = @user_id
            delLnk.item_id = id
            delLnk.is_recovery = 1
            delLnk.save
          end
        end  
    else
      data << {:error => ids, :description => MSG_DELETE_FAIL}
    end
    res = {:data => data}
    res[:data_error] = data_err #if data_err and data_err.length > 0
    res[:error] = err_code if err_code

    respond_to do |format|
      format.json {render json: res.to_json(:except => EXCEPT_FIELDS, methods: [:uid])
      }
    end
  end
  
  #fetch the content of the site
  def fetch_url
    respond_list = []
    url = params[:url]
    res = {:ressult => "Sorry, we can not load the page!"}
    if url.present?
      begin 
        page = Faraday.get url
        res = { ressult: page.body.force_encoding("ISO-8859-1").encode("UTF-8") }
      rescue
      end
    end
    respond_list << res
    respond_to do |format|
      format.json { render :json => respond_list.to_json }
    end
  end
  
  #get all import bookmark url
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

  def convertUrl(url)
    # url = url.attributes
    # url[:uid] = url[:id]
    # url
    url.uid = url.id
    url
  end

  def convertUrls(urls)
    urls.map{ |x| x.attributes }.each{ |x| x['uid'] = x['id'] }
    # urls.map do |x|
    #   x.uid = x.id
    #   x
    # end
  end

  def collectDuplicateOrderNumber(urls)
    urls.sort_by {|url| url.order_number}
    duplicate_items = Array.new
    i = 0
    # find duplicate Url based on order_number fields
    if urls.size > 1
      while i < urls.size
        j = i + 1 if i < urls.size - 1
        if urls[i].order_number == urls[j].order_number
          duplicate_items << urls[i]
        end
        i+=1
      end 

      if duplicate_items.present?
        duplicate_items = setNewOrder(duplicate_items)
      end
    end

    duplicate_items
  end

  def setNewOrder (items)
    maxOrder = items.max_by(&:order_number).order_number
    # increase the number of order_number based on maximum order_number value    
    i = 0
    # begin loop from maxOrder + 1 
    beginOrder = maxOrder + 1

    while beginOrder < items.size + maxOrder + 1
      items[i].order_number = beginOrder
      i+=1
      beginOrder+=1
    end

    items
  end

  def mapNewOrder (urls)
    # duplicateUrlOrder = Array.new
    duplicateUrlOrder = collectDuplicateOrderNumber(urls) || Array.new
    # map url with duplicateUrlOrder
    if duplicateUrlOrder.present?
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
