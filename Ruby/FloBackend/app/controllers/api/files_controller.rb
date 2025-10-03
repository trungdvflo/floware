class Api::FilesController < Api::BaseController
  
  require 'securerandom'
  # require 'rest_client'
  # require 'net/http/post/multipart'

  EXCEPT_FIELDS = [:user_id]
  
  # rubocop:disable Metrics/MethodLength
  def index
    respond_list = Array.new
    sql = "user_id = :user_id"
    conditions = {:user_id => @user_id}
    
    #get by time
    if params[:modifiedGTE] #get data - greater than or equal
      sql << ' AND updated_date >= :updated_date'
      conditions[:updated_date] = params[:modifiedGTE]
    end
    if params[:modifiedLT] #get data before - less than
      sql << ' AND updated_date < :updated_date'
      conditions[:updated_date] = params[:modifiedLT]
    end
    #get by ids
    ids = params[:ids]
    if ids and ids.length > 0
      sql << ' AND id IN(:ids)'
      conditions[:ids] = ids.split(',')
    end
    #get by uid
    uids = params[:uids]
    if uids
      arrIds = Files.str_ids(uids)
      sql << ' AND uid IN('+arrIds+')'
    end
    #get by client id
    cids = params[:client_ids]
    if cids
      arrIds = Files.str_ids(cids)
      sql << ' AND client_id IN('+arrIds+')'
    end
    #get by obj id
    objIDs = params[:obj_ids]
    if objIDs
      arrIds = Files.str_ids(objIDs)
      sql << ' AND obj_id IN('+arrIds+')'
    end
    
    if params[:minID]
      sql << ' AND id > :min_id'
      conditions[:min_id] = params[:minID] 
    end
    
    objs = Files.where([sql, conditions])
    
    if params[:pItem]
      objs = objs.order('id asc')
      objs = objs.limit(params[:pItem].to_i)
    else
      objs = objs.order('updated_date asc')
    end
    
    #get by fields
    field = params[:fields]
    if field and field.length > 0
      arr = field.split(',')
      f = Array.new
      arr.each do |a|
        f << a if Files.column_names.include?(a.to_s)
      end
      objs = objs.select(f)
    end
    #data change: add and update
    # respond_list << {:data => objs}
    res = {:data => objs}
    
    # get item deleted
    hasDataDel = params[:has_del] #check get deleted data
    if hasDataDel and hasDataDel.to_i == 1
      #deleted items
      objsDel = Array.new()
      objsDel = DeletedItem.get_del_items(@user_id, API_FILE.to_s , params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem])
      # respond_list << {:data_del => objsDel}
      res[:data_del] = objsDel
    end
    
    respond_to do |format|
      format.xml {render :xml => res.to_xml(:except => EXCEPT_FIELDS)}
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
    end
  end
  # rubocop:enable Metrics/MethodLength
  
  #create 
  def create
    objs = params[API_FILES] || params[API_PARAMS_JSON]
    count = 0
    respond_list = Array.new()
    
    data = Array.new()
    data_err = Array.new()

    if objs and objs.length > 0
      if objs.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      objs.each do |obj|
        begin
          # obj = obj[1] if obj.kind_of?(Array)
          ob = Files.new(obj.permit!.except(:id))
          ob.user_id = @user_id
          ob.uid = SecureRandom.uuid.to_s
          if ob.save
            data << ob
          else
            data_err << { error: API_ITEM_CANNOT_SAVE,
                          description: MSG_ERR_NOT_SAVED,
                          attributes: obj }
          end
        rescue
          data_err << { error: API_ITEM_CANNOT_SAVE,
                        description: MSG_ERR_NOT_SAVED,
                        attributes: obj }
        end 
      end
    end
    
    #response dictionary
    res = {:data => data}
    res[:data_error] = data_err if data_err and data_err.length > 0
    
    respond_to do |format|
      format.xml {render :xml => res.to_xml(:except => EXCEPT_FIELDS, :methods => :ref)}
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS, :methods => :ref)}
    end
  end
  
  #update 
  def update
    objs = params[API_FILES] || params[API_PARAMS_JSON]
    count = 0
    respond_list = Array.new()
    
    data = Array.new()
    data_err = Array.new()

    if objs and objs.length > 0
      if objs.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      objs.each do |obj|
        id = obj[:uid]
        next if !id
        cl = Files.find_by(user_id: @user_id, uid: id)
        if cl
          obj.delete(:id)
          begin
            if cl.update_attributes(obj.permit!)
              data << cl
            else
              data_err << { error: API_ITEM_CANNOT_SAVE,
                            description: MSG_ERR_NOT_SAVED,
                            attributes: obj }
            end
          rescue
            data_err << { error: API_ITEM_CANNOT_SAVE,
                          description: MSG_ERR_NOT_SAVED,
                          attributes: obj }
          end
        else
          data_err << { error: API_ITEM_NOT_EXIST, attributes: obj, description: MSG_ERR_NOT_EXIST }
        end 
      end
    end
    
    #response dictionary
    res = {:data => data}
    res[:data_error] = data_err if data_err and data_err.length > 0
    
    respond_to do |format|
      format.xml {render :xml => res.to_xml(:except => EXCEPT_FIELDS)}
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
    end
  end

  # rubocop:disable Metrics/MethodLength
  def destroy
    ids = params[:id] #get list ids
    isByObjID = params[:by_obj_id] ? params[:by_obj_id] : 0 #delete files by object id
    isByClientID = params[:by_client_id] ? params[:by_client_id] : 0 #delete files by client id
    respond_list = Array.new()
    
    data = Array.new()
    data_err = Array.new()
    
    #recovery id
    recovery_ids = params[:re_ids]

    if ids and ids.length > 0
      arrids = ids.split(',')
      res = ''
      if arrids and arrids.length > 0
        arrids.each do |id|
          int = Integer(id) rescue false 
          next if int == 0
          #save deleted item canvas
          if id.to_s.strip != '' 
            data << {:id => id}
            res = res + id.to_s.strip + ',' 
            
            delLnk = DeletedItem.new()
            delLnk.item_type = API_FILE.to_s
            delLnk.user_id = @user_id
            delLnk.item_id = id.to_s
            delLnk.save
          else
            data_err << {:id => id}
          end 
        end
        if res != ''
          res = res.to_s.chop
          #check mode
          mod = 0 #default = uid
          mod = 2 if isByObjID and isByObjID.to_i == 1
          mod = 1 if isByClientID and isByClientID.to_i == 1
          #get fObjs
          fObjs = Files.get_fObjs(@user_id, mod, res)
          #delete file on HDD
          Files.delete_files_onHDD(@user_id, fObjs)
          #delete record on DB
          Files.delete_files_onDB(@user_id, mod, res)
        end
      end
    end  
    #recovery ids
    if recovery_ids and recovery_ids.length > 0
        arrReIds = recovery_ids.split(',')
        # res = ''
        arrReIds.each do |id|
          int = id.to_i
          next if int == 0
          if id.to_s.strip != '' 
            data << {:id => id}
            
            delLnk = DeletedItem.new()
            delLnk.item_type = API_FILE.to_s
            delLnk.user_id = @user_id
            delLnk.item_id = id
            delLnk.is_recovery = 1
            delLnk.save
          else
            data_err << {:id => id}
          end
        end
          
    end
    
    #response dictionary
    result = {:data => data}
    result[:data_error] = data_err if data_err and data_err.length > 0
    
    respond_to do |format|
      format.xml {render :xml => result.to_xml(:except => EXCEPT_FIELDS)}
      format.json {render :json => result.to_json(:except => EXCEPT_FIELDS)}
    end
  end
  # rubocop:enable Metrics/MethodLength

  # rubocop:disable Metrics/MethodLength
  def upload
    respond_list = Array.new
    desPath = UPLOAD_FILE_PATH + @user_id.to_s + "/"
    #check folder exit
    FileUtils.mkpath(desPath)
    
    #set permission for folder, any user can write
    begin
      system "sudo chmod 777 -R " + desPath
    rescue
    end
    
    fUpload = params[:file]
    #upload file
    uid = params[:uid]
    cid = params[:client_id] #for client id
    path = params[:local_path] ? params[:local_path] : ''
    resObj = {}
    if fUpload # and (path.to_s.strip != '')
      fObj = fUpload #File.open(fUpload, 'rb')
      fName = fObj.original_filename
      fExt = '.' + fName.split('.').last
      path = path.present? ? path : fObj.path
      if uid and (uid.to_s.strip != '')
        file = Files.where(uid: uid).first
        if file
          fSource = desPath.to_s + uid.to_s + fExt.to_s
          new_file = File.open(fSource, 'wb') { |f| f.write(fObj.read) }
          
          #update files table
          url = DOWNLOAD_URL_FILE.to_s + uid.to_s
          file.ext = fExt
          file.filename = fName
          file.url = url
          file.size = fObj.size ? fObj.size : 0
          file.save
          
          fnm = {
            # :url => file.url,
            :ext => file.ext,
            :obj_id => file.obj_id,
            :obj_type => file.obj_type,
            :filename => file.filename,
            :client_id => file.client_id,
            :updated_date => file.updated_date,
            :uid => uid
          }
          resObj = {
            # :error => 0,
            :description => "Upload successful.",
            :file => fnm
          }
          
        else #upload fail
            resObj = {
              :error => 1,
              :description => "Upload fail. Find not found uid: "+ uid.to_s
            }
        end
      else #uid is blank, it will auto create new record, client id
        uidNew = SecureRandom.uuid.to_s
        file = Files.new()
        file.user_id = @user_id
        file.uid = uidNew
        file.ext = fExt
        file.local_path = path.to_s.strip
        file.filename = fName
        file.client_id = cid ? cid : SecureRandom.uuid.to_s #get value of client id
        # file.url = DOWNLOAD_URL_FILE.to_s + uidNew.to_s
        file.obj_id = params[:obj_id] ? params[:obj_id] : ''
        file.obj_type = params[:obj_type] ? params[:obj_type] : ''
        
        #upload file
        fSource = desPath.to_s + uidNew.to_s + fExt.to_s
        new_file = File.open(fSource, 'wb') { |f| f.write(fObj.read) }
        file.size = fObj.size ? fObj.size : 0
          
        if file.save
          fnm = {
            # :url => file.url,
            :ext => file.ext,
            :obj_id => file.obj_id,
            :client_id => file.client_id,
            :obj_type => file.obj_type,
            :filename => file.filename,
            :updated_date => file.updated_date,
            :uid => uidNew
          }
          resObj = {
            # :error => 0,
            :description => "Upload successful.",
            :file => fnm
          }
          
        else
          resObj = {
            :error => 1,
            :description => "Upload fail."
          }
        end
      end
    else #path is blank
      resObj = {
            :error => 1,
            :description => "Upload fail.Can not found file upload"
          }
    end
    
    # respond_list << resObj
        
    respond_to do |format|
      format.xml {render :xml => resObj.to_xml(:except => EXCEPT_FIELDS)}
      format.json {render :json => resObj.to_json(:except => EXCEPT_FIELDS)}
    end
  end
  # rubocop:enable Metrics/MethodLength

  #download file
  def download
    isFail = false
    respond_list = Array.new
    desPath = UPLOAD_FILE_PATH + @user_id.to_s + "/"
    uid = params[:uid]
    cid = params[:client_id]
    obj_id = params[:obj_id]
    
    #add condition to get file
    condition = ''
    condition << (' AND uid = "' + uid.to_s + '"') if uid and uid.to_s.strip != ''
    condition << (' AND client_id = "' + cid.to_s + '"') if cid and cid.to_s.strip != ''
    condition << (' AND obj_id = "' + obj_id.to_s + '"') if obj_id and obj_id.to_s.strip != ''
    
    #check condition
    if condition.to_s.strip != ''
      sql = ' user_id ="' + @user_id.to_s + '"'
      sql << condition
      file = Files.where(sql).first
      if file
        begin
          data = ""
          fName = file.filename
          fPath = desPath.to_s + file.uid.to_s.strip + file.ext.to_s
          send_file(fPath, :filename => fName)
        
          # if !request.headers["Range"]
            # send_data( fObj.read, :filename => fName)
          # else
            # file_begin = 0
            # file_size = file.size.to_i
            # file_end = file_size - 1
#           
            # status_code = "206 Partial Content"
            # match = request.headers['range'].match(/bytes=(\d+)-(\d*)/)
            # if match
              # file_begin = match[1]
              # file_end = match[1] if match[2] && !match[2].empty?
            # end
            # response.header["Content-Range"] = "bytes " + file_begin.to_s + "-" + file_end.to_s + "/" + file_size.to_s
#             
            # response.header["Content-Length"] = (file_end.to_i - file_begin.to_i + 1).to_s
            # response.header["Last-Modified"] = file.updated_date.to_s
#           
            # response.header["Cache-Control"] = "public, must-revalidate, max-age=0"
            # response.header["Pragma"] = "no-cache"
            # response.header["Accept-Ranges"]=  "bytes"
            # response.header["Content-Transfer-Encoding"] = "binary"
            # send_file(fObj.read, 
              # :filename => fName,
              # # :type => @media.file_content_type, 
              # :disposition => "inline",
              # :status => status_code,
              # :stream =>  'true',
              # :buffer_size  =>  4096)
          # end
          
  
          # need to check and show on browser or download
          # send_data( f.read, :filename => fName, :disposition => 'inline', :type => 'image/jpg')
        rescue #file not existed
          isFail = true
        end
      else #can not find file on Db
        isFail = true
      end
    else
      isFail = true
    end
    
    if isFail
      res = {
        :error => 1,
        :description => "Download failed, find not found"
      }
      respond_to do |format|
        format.xml {render :xml => res.to_xml(:except => EXCEPT_FIELDS)}
        format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
      end
    end
  end

  def save_file_info
    objs = params[:files]
    respond_list = []
    if objs and objs.length > 0
      objs.each do |obj|
        if obj
          file = Files.new(obj.permit!.except(:id))
          file.user_id = @user_id
          file.uid = obj[:uid] || SecureRandom.uuid.to_s
          if file.save
            respond_list << {:data => file, :description => "Update successful."}
          else
            respond_list << {:error => file.errors, :description => MSG_ERR_INVALID}
          end
        end
      end
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
    end
  end
end
