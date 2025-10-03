class Api::LinksController < Api::BaseController
  include Pundit
  before_action :limit_params, only: [:create, :update]

  def index
    @links = Link.where(user_id: current_user.id)
                 .with_modifiedGTE(params[:modifiedGTE])
                 .with_modifiedLT(params[:modifiedLT])
                 .with_ids(params[:ids])
                 .with_min_id(params[:minID])
                 .with_p_item(params[:pItem])
                 .with_fields(params[:fields])
    if params[:has_del].to_i == 1
      @links_deleted = DeletedItem.where(user_id: current_user.id, item_type: API_LINK)
                                  .with_modifiedGTE(params[:modifiedGTE])
                                  .with_modifiedLT(params[:modifiedLT])
                                  .with_ids(params[:ids])
                                  .with_min_id(params[:minDelID])
                                  .with_p_item(params[:pItem])
    end
  end

  def shared
    project_ids = project_ids_authorized

    links = Link.arel_table
    clause_1 = links[:destination_id].in project_ids
    clause_2 = links[:source_id].in project_ids
    @links = Link.where(clause_1.or(clause_2))
                 .with_modifiedGTE(params[:modifiedGTE])
                 .with_modifiedLT(params[:modifiedLT])
                 .with_ids(params[:ids])
                 .with_min_id(params[:minID])
                 .with_p_item(params[:pItem])
                 .with_fields(params[:fields])
  end

  def create
    @links = []
    @links_errors = []

    params[:links].each do |hash|
      if hash[:destination_type] == API_FOLDER
        destination_project = Project.find_by(id: hash[:destination_id]) || Project.new
        authorize destination_project, :owner_or_member?
      end

      if hash[:source_type] == API_FOLDER
        source_project = Project.find_by(id: hash[:source_id]) || Project.new
        authorize source_project, :owner_or_member?
      end
    end

    params[:links].each do |hash|
      if hash[:destination_type] == API_FOLDER
        destination_project = Project.find_by(id: hash[:destination_id])

        # Objects from a shared collection may not be added or moved to another shared collection.
        if destination_project.proj_type == Project::SHARED and linked_shared_project?(hash[:source_id])
          next
        end
      end

      if hash[:meta_data].present?
        if valid_json? hash[:meta_data].to_json
          meta_data = hash[:meta_data].to_json
        else
          @links_errors << { error: API_ITEM_CANNOT_SAVE,
                            description: 'Meta data invalid',
                            attributes: hash }
          next
        end
      end

      if hash[:source_account].blank?
        hash[:source_account] = 0
      end

      if hash[:destination_account].blank?
        hash[:destination_account] = 0
      end

      link = Link.new hash.permit!.except(:id, :meta_data)
      link.user_id = current_user.id
      link.meta_data = meta_data

      if link.save
        @links << link
      else
        @links_errors << { error: API_ITEM_CANNOT_SAVE, attributes: hash, description: link.errors.full_messages.join(',') }
      end
    end
  end

  def update
    @links = []
    @links_errors = []

    params[:links].each do |hash|
      link = Link.find_by(id: hash[:id])
      next if link.blank?

      if hash[:destination_id].present?
        if hash[:destination_type] == API_FOLDER or (hash[:destination_type].blank? and link.destination_type == API_FOLDER)
          destination_project = Project.find_by(id: hash[:destination_id]) || Project.new
          authorize destination_project, :owner_or_member?
        end
      end
      if hash[:source_id].present?
        if hash[:source_type] == API_FOLDER or (hash[:source_type].blank? and link.source_type == API_FOLDER)
          source_project = Project.find_by(id: hash[:source_id]) || Project.new
          authorize source_project, :owner_or_member?
        end
      end
    end

    params[:links].each do |hash|
      link = Link.find_by(id: hash[:id])
      if link.blank?
        @links_errors << { error: API_ITEM_NOT_EXIST, attributes: hash,
                           description: MSG_ERR_NOT_EXIST }
        next
      end

      # Object from shared collection can't move to private collection or another shared collection
      if hash[:destination_id].present?
        if hash[:destination_type] == API_FOLDER or (hash[:destination_type].blank? and link.destination_type == API_FOLDER)
          destination_project = Project.find_by(id: hash[:destination_id])
          if destination_project&.proj_type == Project::SHARED and linked_shared_project?(hash[:source_id])
            @links_errors << { error: API_ITEM_CANNOT_SAVE, link: hash,
                               description: 'Can not move object from shared collection' }
            next
          end
        end
      end

      if hash[:meta_data].present?
        if valid_json? hash[:meta_data].to_json
          hash[:meta_data] = hash[:meta_data].to_json
        else
          @links_errors << { error: API_ITEM_CANNOT_SAVE,
                            description: 'Meta data invalid',
                            attributes: hash }
          next
        end
      end

      if link&.update_attributes hash.permit!.except(:user_id)
        @links << link
      else
        @links_errors << { error: API_ITEM_CANNOT_SAVE, link: hash,
                           description: link&.errors&.full_messages.join(',') || MSG_ERR_NOT_SAVED }
      end
    end
  end

  def destroy
    @deleted_ids = []
    @delete_ids_errors = []

    links_params.each do |hash|
      link = Link.find_by(id: hash[:id], user_id: current_user.id)

      if link&.destroy
        @deleted_ids << link.id
      else
        @delete_ids_errors << { error: API_ITEM_NOT_EXIST, description: MSG_ERR_NOT_EXIST, id: hash[:id] }
      end
      deleted_item_service({ ids: @deleted_ids }).execute
    end
  end

  ###########################################################################################

  # rubocop:disable Metrics/MethodLength, Metrics/BlockLength
  # TODO: duplicate code
  # delete link with email and canvas detail of this email
  def destroy_by_uid
    uid = params[:uid]
    type = params[:type]
    host_uid = params[:host_uid]
    link_uid = params[:link_uid]
    acc_3rd_id = params[:acc_3rd_id]
    is_invalid = params[:is_invalid]

    @links = []
    sql = ""

    respond = {:success => API_ITEM_CANNOT_DELETE }
    begin
      if uid.present?
        obj = JSON.parse(Base64.decode64(uid).force_encoding("UTF-8"))
        if obj['path'].present?
          res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
          obj_id = Base64.strict_encode64(res.to_json)
        end
      end

      if host_uid.present?
        obj = JSON.parse(Base64.decode64(host_uid).force_encoding("UTF-8"))
        if obj['path'].present?
          res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
          host_uid = Base64.strict_encode64(res.to_json)
        end
      end

      if link_uid.present?
        obj = JSON.parse(Base64.decode64(link_uid).force_encoding("UTF-8"))
        if obj['path'].present?
          res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
          link_uid = Base64.strict_encode64(res.to_json)
        end
      end
    rescue
    ensure
      ActiveRecord::Base.transaction do
        if uid.present?
          sql = 'user_id = ? AND
                (source_id = ? AND destination_type = ?) OR
                (destination_id = ? AND source_type = ?)'

          @links = Link.where([sql, @user_id, uid, type, uid, type])

          DeletedItem.save_deleted_item(@user_id, @links)

          record = Link.where([sql, @user_id, uid, type, uid, type]).delete_all
        elsif host_uid.present? and link_uid.present?
          sql = 'user_id = ? AND (
                  (source_id = ? AND destination_id = ?) OR
                  (destination_id = ? AND source_id = ?) )'

          @links = Link.where([sql, @user_id, host_uid, link_uid, host_uid, link_uid])
          if is_invalid
            unless @links.blank?
              if @links.first.source_id == link_uid
                link_type = @links.first[:source_type]
              else
                link_type = @links.first[:destination_type]
              end

              case link_type
              when "VEVENT", "VTODO", "VJOURNAL", "URL"
                # despite is get link_uid on source or destination, is 2 case require delete 2 case because
                # position of link_uid on source or destination don't fixed
                @links_src = Link.where(user_id: @user_id, source_type: link_type)
                                 .where(source_id: link_uid)
                DeletedItem.save_deleted_item(@user_id, @links_src)
                @links_src.delete_all

                @links_des = Link.where(user_id: @user_id, source_type: link_type)
                                 .where(destination_id: link_uid)
                DeletedItem.save_deleted_item(@user_id, @links_des)
                @links_des.delete_all
              # when "VCARD"
              # when "FOLDER"
              end
            end
          end

          DeletedItem.save_deleted_item(@user_id, @links)
          record = Link.where([sql, @user_id, host_uid, link_uid, host_uid, link_uid]).delete_all
        elsif acc_3rd_id.present?
          sql = 'user_id = ? AND source_account = ? OR destination_account = ?'

          @links = Link.where([sql, @user_id, acc_3rd_id, acc_3rd_id])

          DeletedItem.save_deleted_item(@user_id, @links)

          record = Link.where([sql, @user_id, acc_3rd_id, acc_3rd_id]).delete_all
        end

        @canvas = []
        if @links.present?
          @links.each do |link|
            if link.destination_type == API_FOLDER or link.source_type == API_FOLDER
              sql = <<-SQL
                canvas_detail.user_id = ? AND 
                (kanbans.project_id = ? AND canvas_detail.item_id = ? AND canvas_detail.item_type = ?) OR 
                (kanbans.project_id = ? AND canvas_detail.item_id = ? AND canvas_detail.item_type = ?)
              SQL
              @canvas_d = Canvas
                  .joins("left join kanbans on kanbans.id = canvas_detail.kanban_id and kanbans.user_id = canvas_detail.user_id")
                  .where([sql, link.user_id, link.destination_id, link.source_id, link.source_type, link.source_id, link.destination_id, link.destination_type])
              @canvas_d.each { |x| save_delete_item(API_CANVAS_TYPE, x.id) }
              @canvas = @canvas_d.destroy_all
            end
          end
        end
        unless @canvas.blank?
          @canvas = @canvas.to_a.dup
          @canvas.uniq!
          @canvas.flatten!
        end
        if record == 0
          respond = {:success => API_ITEM_NOT_EXIST, :record => record, :canvas => @canvas}
        else
          respond = {:success => API_SUCCESS, :record => record, :canvas => @canvas}
        end
      end
    end

    respond_to do |format|
      format.json {render :json => respond.to_json(:root => false)}
    end
  end
  # rubocop:enable Metrics/MethodLength, Metrics/BlockLength

  def destroy_all_by_email
    id = params[:id]

    respond = {:error => MSG_DELETE_FAIL, :record => id}
    # if id.present?
    #   id.each do |id|
    #     obj = JSON.parse(Base64.decode64(id).force_encoding("UTF-8"))
    #     if obj['path'].present?
    #       res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
    #       id = Base64.strict_encode64(res.to_json)
    #
    #       respond = {:success => API_SUCCESS, :record => record}
    #     end
    #   end
    # end
    if id.present?
      obj = JSON.parse(Base64.decode64(id).force_encoding("UTF-8"))
      if obj['path'].present?
        res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
        id_after_convert = Base64.strict_encode64(res.to_json)

        sql = 'user_id = :user_id AND (source_id = :id OR destination_id = :id)'

        @links = Link.where(sql, { :user_id => @user_id, :id => id_after_convert })

        #  Items linked with this email
        linkedItems = Array.new
        @links.each do |link|
          if link.source_id == id_after_convert
              linkedItem = {:itemType => link.destination_type, :uid => link.destination_id}
          else
              linkedItem = {:itemType => link.source_type, :uid => link.source_id}
          end
          linkedItems.push(linkedItem)
        end

        DeletedItem.save_deleted_item(@user_id, @links)
        record = @links.delete_all
        respond = {:success => API_SUCCESS, :record => record, :deleted => linkedItems}
      end
    end

    respond_to do |format|
      format.json {render :json => respond}
    end
  end

  def destroy_all_by_emails
    ids = params[:ids]

    respond = {:error => MSG_DELETE_FAIL, :record => ids}
    # if id.present?
    #   id.each do |id|
    #     obj = JSON.parse(Base64.decode64(id).force_encoding("UTF-8"))
    #     if obj['path'].present?
    #       res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
    #       id = Base64.strict_encode64(res.to_json)
    #
    #       respond = {:success => API_SUCCESS, :record => record}
    #     end
    #   end
    # end
    ids_after_convert = []
    if ids.present?
      ids = ids.split(',')
      ids.each do |id|
      obj = JSON.parse(Base64.decode64(id).force_encoding("UTF-8"))
        if obj['path'].present?
          res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
          id_after_convert = Base64.strict_encode64(res.to_json)
          ids_after_convert.push id_after_convert
        end
      end

      ActiveRecord::Base.transaction do
        @links = Link.where("user_id = :user_id and (source_id IN (:source_id) or destination_id IN (:destination_id))", {
            user_id: @user_id,
            source_id: ids_after_convert,
            destination_id: ids_after_convert
        })
        DeletedItem.save_deleted_item(@user_id, @links)

        record = @links.delete_all

        respond = {:success => API_SUCCESS, :record => record}
      end
    end

    respond_to do |format|
      format.json {render :json => respond}
    end
  end

  # rubocop:disable Metrics/MethodLength
  # update all records whose source_id or destination_id are old_id to new id
  def update_ids
    old_id = params[:old_id]
    old_type = params[:old_type]
    new_id = params[:new_id]
    old_root_uid = params[:old_root_uid] || ""
    new_root_uid = params[:new_root_uid] || ""
    old_link_account = params[:old_link_account]
    new_link_account = params[:new_link_account]
    
    begin
      decoded_old_id = Base64.decode64(old_id).force_encoding("UTF-8")
      obj = JSON.parse(decoded_old_id) if decoded_old_id.present?
      if obj and obj['path'].present?
        res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
        old_id = Base64.strict_encode64(res.to_json)
      end

      decoded_new_id = Base64.decode64(new_id).force_encoding("UTF-8")
      obj = JSON.parse(decoded_new_id) if decoded_new_id.present?
      if obj and obj['path'].present?
        res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
        new_id = Base64.strict_encode64(res.to_json)
      end
    rescue
    ensure
      src_link_params = { user_id: @user_id, source_id: old_id, 
                          source_type: old_type,
                          source_account: old_link_account,
                          source_root_uid: old_root_uid }
      des_link_params = { user_id: @user_id,
                          destination_id: old_id,
                          destination_type: old_type,
                          destination_account: old_link_account,
                          destination_root_uid: old_root_uid }
      src_link_params = src_link_params.delete_if {|_key, value| value.blank? }
      des_link_params = des_link_params.delete_if {|_key, value| value.blank? }
      # query all once time
      src_links = Link.where(src_link_params)
      des_links = Link.where(des_link_params)

      #seprate update 
      #in iphone, mac, ipad they often use destination_id(email, note, ...) to link and source_id(folder)
      #in floonline we use source_id(email, note..) to link and destination_id(folder) 
      data_update_src_link_params = { source_id: new_id, source_account: new_link_account, source_root_uid: new_root_uid };
      data_update_des_link_params = { destination_id: new_id, destination_account: new_link_account, destination_root_uid: new_root_uid };
      # don't remove blank data update because don't update when change calendar to FLOL
      src_links.find_each { |m| m.update_attributes(data_update_src_link_params) } if src_links.present?
      des_links.find_each { |m| m.update_attributes(data_update_des_link_params) } if des_links.present?
      updated_links = src_links.to_a.concat(des_links)
      #return links result to client
      # don't get from DB improve performent but its can error when update don't success
      if updated_links.present?
        updated_links.each do |link|
          if link[:source_type] == old_type and link[:source_id] == old_id
            link.source_id = new_id
            link.source_root_uid = new_root_uid
            link.source_account = new_link_account
          elsif link[:destination_type] == old_type and link[:destination_id] == old_id
            link.destination_id = new_id
            link.destination_root_uid = new_root_uid
            link.destination_account = new_link_account
          end
        end
      end

      #return canvases data to client
      canvases = Canvas.where("user_id = ? and item_id = ?", @user_id, old_id)
      if canvases.present? and canvases.update_all(item_id: new_id)
        canvases.each do |canvas|
          canvas.item_id = new_id
        end
      end

      respond_to do |format|
        format.json {render :json => {updated_links: updated_links, updated_canvas: canvases}}
      end
    end
  end
  # rubocop:enable Metrics/MethodLength

  # rubocop:disable Metrics/MethodLength
  # find links which include "uid" and link to another item whose type is "type"
  # TODO: support 3rd accs
  def links_by_uid
    uid = params[:uid]
    links = []
    tp_links = []
    tp_data = []
    has_trash = params[:has_trash] || false

    if uid.present?
      # filter links linked to `uid` then group by types
      # { 'VTODO' => [{object},...] }
      begin
        obj = JSON.parse(Base64.decode64(uid).force_encoding("UTF-8"))
        if obj['path'].present?
          res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
          uid = Base64.strict_encode64(res.to_json)
        end
      rescue
      ensure
        links = __links_by_type(uid, has_trash)

        # separate link from 3rd party account  
        links_partition = links.partition do |x|
          x[:account_id] != '' && x[:account_id] != "0" && x[:type] != "FOLDER" && x[:type] != "EMAIL"
        end

        # case: partition return true array
        tp_links = links_partition[0]

        # case: partition return false array
        links = links_partition[1]
        links = links.group_by {|x| x[:type]}.except("FOLDER")

        # get 3rd party object
        if tp_links.any?
          # get data for 3rd object
          # TODO: get data of 3rd object by UID
          tp_data = __get_tp_link_data(tp_links)

          if tp_data.any?
            tp_data.map {|x| x["type"] = x["itemType"] || x[:type]}
          end
        end

        # get links data by its types & ids
        ids = []
        data = []
        links.each do |key, value|
          case key
          when 'VTODO', 'VJOURNAL', 'VEVENT', 'STODO'
            data.concat(__get_co_data(value))
          when 'VCARD'
            data.concat(__get_contact_data(value))
          when 'EMAIL'
            data.concat(__get_email_data(value))
          when 'URL'
            data.concat(__get_url_data(value))
          end
        end

        #include tp data
        if tp_data.any?
          data.concat(tp_data)
        end

        # only get id in trash to check case (trashed)
        trash_ids = __get_trash_id
        data.push(trash_ids) if trash_ids

        data.map! do |d|
          if d[:itemType].blank? && d["itemType"].blank?
            d.merge({ :isInvalid => true})
          end
          if trash_ids.present? && trash_ids["ids"].include?(d["id"])
            d.merge({ :isTrash => true})
          end
          d
        end

        # group link data by type
        data = data.group_by {|x| x["type"]}
      end
      respond_to do |format|
        format.json {render :json => data}
      end
    end
  end
  # rubocop:enable Metrics/MethodLength

  def flol_check_mail_link
    arr_email = []
    Link.not_exits_on_email_source(@user_id, "id, source_type, source_id").map do |l|
      arr_email << JSON.parse(Base64.decode64(l.source_id))
    end
    arr_email.delete_if do |e|
      uid =e["uid"]&.to_i
      uid.nil? ? true : false
    end
    # pp arr_email
    render :json => {
                        '0' => arr_email.group_by { |e| e['path'] }
                    }
  end

  def get_email_links_by_folder_id
    folder_id = params[:folder_id]
    res = Link.get_email_links_from_folder(@user_id, folder_id)
    respond_to do |format|
      format.json {render :json => {links: res}.to_json(:root => false)}
    end
  end

  def get_sorted_url_links_by_folder_id
    folder_id = params[:folder_id]
    sort_type = params[:sort_type]
    res = Link.get_sorted_url_links_from_folder(@user_id, folder_id, sort_type)
    respond_to do |format|
      format.json {render :json => {links: res}.to_json(:root => false)}
    end
  end

  def folder_ids
    # for check improve performance kanban
    # Benchmark.bm do |x|
    # x.report("slow:") {
    uids, res = params['uids'], []
    # puts uids
    if uids.is_a?(Array) and uids.any?
      obj_ids = []
      uids.each do |u|
        begin
          source_id = u['source_id']
          obj = JSON.parse(Base64.decode64(source_id).force_encoding("UTF-8"))
          if obj['path'].present?
            json_data = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
            source_id = Base64.strict_encode64(json_data.to_json)
          end
        rescue
        ensure
          obj_ids << source_id
        end
      end
      if obj_ids.any?
        links = Link.folder_links(@user_id, obj_ids)
        if links.any?
          obj_ids.each do |u|
            # TODO: change source/destination accounts when change calendar Flo/3rd
            # NOTE: error code
            items = links.find_all do |l|
              (l.source_id == u.to_s or l.destination_id == u.to_s)
              # and l.source_account == (u['source_account'].to_s or '') and
              # l.destination_account == (u['destination_account'].to_s or '')
            end

            items = items.map do |i|
              if (i.source_type == 'FOLDER')
                {link: {link_id: i.id, folder_id: i.source_id}}
              else
                {link: {link_id: i.id, folder_id: i.destination_id}}
              end
            end
            res << items
          end
        end
      end
    end

    respond_to do |format|
      format.json {render :json => res} #ActiveSupport::JSON.encode(res)
    end
  end

  #get all links by obj id
  def get_links_by_obj
    obj_id = 0
    obj_id = params[:obj_id] if params[:obj_id]
    obj_type = API_FOLDER
    obj_type = params[:obj_type] if params[:obj_type]
    res = []
    if obj_id
      res = Link.get_links_by_obj(@user_id, obj_type, obj_id)
    end
    respond_to do |format|
      format.json { render :json => res }
    end
  end

  def get_links_group_by_type
    respond_list = Array.new
    # sql = "user_id = :user_id"
    conditions = {:user_id => @user_id}

    sql_src = "user_id = :user_id"
    sql_des = "user_id = :user_id"
    if uid == params[:uid]
      sql_src << " AND source_id = :uid"
      sql_des << " AND destination_id = :uid"
      conditions = conditions.merge({ uid: uid })
    end

    sql_src << " AND destination_type != '#{API_FOLDER}'"
    sql_des << " AND source_type != '#{API_FOLDER}'"

    lnks_src = Link.where([sql_src, conditions]).group(:destination_id) # .group('destination_id AS grouped_name')
    lnks_des = Link.where([sql_des, conditions]).group(:source_id) # .group('source_id AS grouped_name')
    arr_group_link_uid_src = lnks_src.select('DISTINCT(destination_type)')
    arr_group_link_uid_des = lnks_des.select('DISTINCT(source_type)')

    lnks = Hash.new
    arr_group_link_uid_src.each do |group|
      tmp = lnks_src.group_by { |l| l.destination_type == group.destination_type }

      # arr = tmp[true].map { |l| l.destination_id }
      arr = tmp[true].map&.destination_id
      case group.destination_type
      when API_EMAIL
        lnks[group.destination_type] = arr.map do |e|
          data = JSON.parse(Base64.decode64(e).force_encoding("UTF-8"))
          data[:link_count] = Link.count_link_by_uid(e)
          data
        end
      when API_VEVENT, API_VTODO, API_VJOURNAL
        lnks[group.destination_type] = arr.map do |e|
          data = CalendarObject.where(:uid => e).first.attributes
          data[:link_count] = Link.count_link_by_uid(e)
          data
        end
      else
        lnks[group.destination_type] = arr
      end
    end
    arr_group_link_uid_des.each do |group|
      # tmp = lnks_des.group_by { |l| l.source_type == group.source_type }
      lnks[group.source_type] = arr
    end
    respond_list << lnks_src
    respond_list << lnks_des

    respond_list = lnks
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
    end
  end

  # search api in Link section=======================================
  def search_all_objects
    data = []
    qs = params[:qs]

    # using XML send request to SabreDAV
    # cal_uris = Calendar.select("uri").where('principaluri like ?', '%' + @email)
    #           .each() do |x|
    #             result = search_cal_object_data(qs, x.uri)                
    #             if result.present?
    #               byebug
    #               cal_obj = Api::Web::Utils.convert_calendar_obj(result, false)
    #               data.push(cal_obj)
    #             end                
    #           end
    # data

    # get url bookmark
    data.concat(__search_url(qs))

    # get calendar object    
    data.concat(__search_cal(qs))

    # get contacts
    data.concat(__search_contact(qs))

    data = {"items" => data}
    respond_to do |format|
      format.json {render :json => data}
    end
  end

  def get_sorted_calobj_links_by_folder_id
    folder_id = params[:folder_id]
    item_type = params[:item_type]
    sort_type = params[:sort_type]
    res = Link.get_sorted_calobj_links_from_folder(@user_id, folder_id, item_type, sort_type)
    respond_to do |format|
      format.json {render :json => {links: res}.to_json(:root => false)}
    end
  end

  def get_sorted_cardobj_links_by_folder_id
    folder_id = params[:folder_id]
    sort_type = params[:sort_type]
    res = Link.get_sorted_cardobj_links_from_folder(@user_id, folder_id, sort_type)
    respond_to do |format|
      format.json {render :json => {links: res}.to_json(:root => false)}
    end
  end

  # count the number of links for each uid
  def count_link
    # uids = params['uids']
    uids = params['uids']&.map { |uid| uid.to_s } # fix for bookmark
    res = []

    if uids.is_a?(Array) and uids.any?
      links = Link.count_link_by_uids(uids, @user_id)
      uids.each do |uid|
        item = {}
        item["uid"] = uid
        item["link_count"] = 0
        links.each do |lnk|
          if lnk.uid == uid 
            item["link_count"] = lnk.link_count
          end
        end
        res.push(item)
      end
    end

    respond_to do |format|
      format.json {render :json => res}
    end
  end

  def count_rows_invalid_flol_not_email
    num_rows_dup = __count_rows_duplicate(@user_id).size

    num_rows_not_exits_on_parent = __count_get_row_not_exits_on_parent_tbl

    respond_to do |format|
      format.json {
        render :json => {
            :num_rows_invalid => (num_rows_dup + num_rows_not_exits_on_parent),
            :ids_not_exits_on_parent => []
        }
      }
    end
  end

  def count_rows_invalid_flol_not_email_projs_urls_cards_and_dup
    num_rows_dup = __count_rows_duplicate(@user_id).size

    # rows_not_exits_on_parent = __get_row_not_exits_on_parent_tbl_projs_urls_cards
    # turn off count only dup don't count urls and cards with feature updated new
    rows_not_exits_on_parent = {}
    num_rows_not_exits_on_parent = rows_not_exits_on_parent[:num_rows_invalid] || 0

    respond_to do |format|
      format.json {
        render :json => {
            num_rows_invalid: (num_rows_dup + num_rows_not_exits_on_parent),
            ids_not_exits_on_parent: rows_not_exits_on_parent[:ids_not_exits_on_parent] || []
        }
      }
    end
  end

  def count_rows_invalid_flol_not_email_events_todos_notes
    rows_not_exits_on_parent = __count_get_row_not_exits_on_parent_tbl_events_todos_notes
    num_rows_not_exits_on_parent = rows_not_exits_on_parent[:num_rows_invalid] || 0

    respond_to do |format|
      format.json {
        render :json => {
            num_rows_invalid: num_rows_not_exits_on_parent,
            ids_not_exits_on_parent: rows_not_exits_on_parent[:ids_not_exits_on_parent] || []
        }
      }
    end
  end

  def count_rows_invalid_flol_not_email_link_types
    link_types = params[:link_types].split(',')

    num_rows_not_exits_on_parent = 0

    unless link_types.blank?
      # params[:return] = true
      if params[:return]
        rs = __get_row_not_exits_on_parent_tbl_link_types(link_types, false, false, params[:return])
        num_rows_not_exits_on_parent = rs[:num_rows_invalid]
        ids_not_exits_on_parent = rs[:ids_not_exits_on_parent]
      else
        num_rows_not_exits_on_parent = __get_row_not_exits_on_parent_tbl_link_types(link_types)
      end
    end

    respond_to do |format|
      format.json {
        render :json => {
            :num_rows_invalid => num_rows_not_exits_on_parent,
            :ids_not_exits_on_parent => ids_not_exits_on_parent || []
        }
      }
    end
  end

  def count_rows_invalid_flol_not_email_src
    link_types = params[:link_types].split(',')

    num_rows_not_exits_on_parent = 0
    unless link_types.blank?
      if params[:return]
        num_rows_not_exits_on_parent = __count_get_row_not_exits_on_parent_tbl_src(link_types, false, false, true)
      else
        num_rows_not_exits_on_parent = __count_get_row_not_exits_on_parent_tbl_src(link_types)
      end
    end

    respond_to do |format|
      format.json {
        render :json => num_rows_not_exits_on_parent
      }
    end
  end

  def count_rows_invalid_flol_not_email_des
    link_types = params[:link_types].split(',')

    num_rows_not_exits_on_parent = 0
    unless link_types.blank?
      if params[:return]
        num_rows_not_exits_on_parent = __count_get_row_not_exits_on_parent_tbl_des(link_types, false, false, true)
      else
        num_rows_not_exits_on_parent = __count_get_row_not_exits_on_parent_tbl_des(link_types)
      end
    end

    respond_to do |format|
      format.json {
        render json: num_rows_not_exits_on_parent
      }
    end
  end

  # return number row_not exits on parent tbl for events todos notes
  #
  # @param [true, false] is_third_party hihi
  # @param [Integer] third_party_id if is_third_party == true
  #
  # @return [Array<Link>] return all row_not exits on parent tbl
  def __count_get_row_not_exits_on_parent_tbl_events_todos_notes(is_third_party = false, third_party_id = false, return_data = true)
    # get list not exits on table parent etc: source_type or destination_type is 'URL' with table 'urls'
    # res = 0
    # puts res

    res = if is_third_party
            Link.from("(#{Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, %w[VEVENT VTODO VJOURNAL], third_party_id).to_sql} UNION
              #{Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, %w[VEVENT VTODO VJOURNAL], third_party_id).to_sql}) AS links")
            # links_src = Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id)
            # ap links_src
            # link_des = Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id)
            # ap link_des
          else # is FLOL
            Link.from("(#{Link.not_exits_on_tbl_calendarobjects_source(@user_id, %w[VEVENT VTODO VJOURNAL]).to_sql} UNION {Link.not_exits_on_tbl_calendarobjects_destination(@user_id, %w[VEVENT VTODO VJOURNAL]).to_sql}) AS links")
          end

    {
        num_rows_invalid: res.count(),
        ids_not_exits_on_parent: return_data ? res.map&.id : []
    }
  end

  # Delete duplicate and remove link not exits on parents
  #
  # if you problem with sql when delete row should use
  # Update: Since people Googling for removing duplicates end up here
  # Although the OP's question is about DELETE, please be advised that using INSERT and DISTINCT is much faster.
  # For a database with 8 million rows, the below query took 13 minutes, while using DELETE, it took more than 2 hours and yet didn't complete.
  #
  #     `INSERT INTO tempTableName(cellId,attributeId,entityRowId,value)
  #     SELECT DISTINCT cellId,attributeId,entityRowId,value
  #     FROM tableName;`
  #     https://stackoverflow.com/questions/4685173/delete-all-duplicate-rows-except-for-one-in-mysql
  #
  # @params ids_not_exits_on_parent [String] it is join with `,`
  # @params abc (see #__get_row_not_exits_on_parent_tbl)
  #
  # @returns base on *not_exits_on_tbl_calendarobjects_source* or *not_exits_on_tbl_calendarobjects_destination*
  # return nil if do not in 3 type

  def del_invalid_and_dup
    ActiveRecord::Base.transaction do
      # delete invalid for email
      ids_not_exits_on_parent = params[:ids_not_exits_on_parent]
      Link.delete_all_links(@user_id, ids_not_exits_on_parent) if ids_not_exits_on_parent.present?

      # delete invalid for not email
      Link.delete_dup(@user_id)

      ids_not_exits_on_parent = []
      if params[:email] == @email
        ids_not_exits_on_parent << __del_get_row_not_exits_on_parent_tbl
      else
        SetAccount.where(user_id: @user_id).each do |acc|
          account_sync = JSON.parse(acc.account_sync)
          if acc.user_income == params[:email] && (account_sync['Email'] != 0 || account_sync['Calendar'] != 0)
            ids_not_exits_on_parent << __del_get_row_not_exits_on_parent_tbl(true, acc.id)
          end
        end
      end

      respond_to do |format|
        format.json {
          render :json => {
              :success => API_SUCCESS,
              :ids => ids_not_exits_on_parent.split(','), # ids don't have dup row because affect performance when mysql no support returning or
              :description => MSG_DELETE_SUCCESS
          }
        }
      end
    end
  rescue => ex
    logger.error ex
    ap ex
    respond_to do |format|
      format.json {
        render :json => {
            :status => 500
        }, :status => 500
      }
    end
  end

  def rows_invalid_3rd_not_email
    third_party_id = params[:third_party_id]

    # on flol is check should don't check 3rd party
    num_rows_dup = 0

    res = __get_row_not_exits_on_parent_tbl(true, third_party_id)
    rows_not_exits_on_parent = res.map(&:id)
    # because rails 3 don't cache sql, should use size not affect to performance
    num_rows_not_exits_on_parent = rows_not_exits_on_parent.size

    respond_to do |format|
      format.json {
        render :json => {
            :num_rows_invalid => (num_rows_dup + num_rows_not_exits_on_parent),
            :ids_not_exits_on_parent => rows_not_exits_on_parent
        }
      }
    end
  end

  private

  def linked_shared_project?(source_id)
    project_ids = Link.where(source_id: source_id, destination_type: API_FOLDER).map(&:destination_id)
    return true if Project.where(id: project_ids, proj_type: Project::SHARED).count > 0
    false
  end

  def valid_json?(json)
    JSON.parse(json)
    true
  rescue
    false
  end

  def __links_by_type(uid, has_trash = false)
    if has_trash
      # get all links, include link so object is linked exits on trash
      Link.where(user_id: @user_id)
          .where("destination_id = :uid OR source_id = :uid", {uid: uid})
          .map do |i|
        if i.source_id == uid.to_s
          {id: i.destination_id,
           type: i.destination_type,
           account_id: i.destination_account,
           root_id: i.destination_root_uid}
        else
          {id: i.source_id,
           type: i.source_type,
           account_id: i.source_account,
           root_id: i.source_root_uid}
        end
      end
    else
      # remove link, so object is linked exits on trash
      obj_ids = Trash.where(user_id: @user_id).select(:obj_id).map(&:obj_id)
      @links = Link.where(user_id: @user_id)
          .where("destination_id = :uid OR source_id = :uid", {uid: uid})
          .map do |i|
        if i.source_id == uid.to_s and !obj_ids.include? i.destination_id
          {id: i.destination_id,
           type: i.destination_type,
           account_id: i.destination_account,
           root_id: i.destination_root_uid}
        elsif i.destination_id == uid.to_s and !obj_ids.include? i.source_id
          {id: i.source_id,
           type: i.source_type,
           account_id: i.source_account,
           root_id: i.source_root_uid}
        end
      end
      @links.compact
    end
  end

  def __get_co_data(item)
    data= []
    ids = []
    item.each do |v|
      ids.push(v[:id])
    end

    cal_objs = CalendarObject.get_co_data(ids, true)

    # get data of each calObj
    cal_objs.each do |x|
      cal_obj_data = __do_get_calobj_data(x)

      # if (cal_obj_data["itemType"] == "VJOURNAL")
      #   # only decode for note content
      #   if cal_obj_data["notecontent"]
      #     cal_obj_data["notecontent"] = Base64.decode64(cal_obj_data["notecontent"])
      #   else 
      #     cal_obj_data["notecontent"] = ""
      #   end
      # end

      # have to merge to get color, icon, summary of calendar object
      data.push(cal_obj_data.merge(x)) if cal_obj_data.present?
    end

    data
  end

  # return number row_not exits on parent tbl for notes
  #
  # @params is_third_party [true, false]
  # @params third_party_id [Integer] if is_third_party == true
  #
  # @returns [Array<Link>] return all row_not exits on parent tbl
  def __count_get_row_not_exits_on_parent_tbl_src(link_types, is_third_party = false, third_party_id = false, return_data = false)
    # # get list not exits on table parent etc: source_type or destination_type is 'URL' with table 'urls'
    # res = 0
    # # puts res
    #
    # if is_third_party
    #   res += Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, link_types, third_party_id).count()
    # else # is FLOL
    #   res += Link.not_exits_on_tbl_calendarobjects_source(@user_id, link_types).count()
    # end
    # # puts res
    #
    # res

    res = []
    if is_third_party
      res << Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, link_types, third_party_id)
    else # is FLOL
      res << Link.not_exits_on_tbl_calendarobjects_source(@user_id, link_types)
    end

    if return_data
      return {
          num_rows_invalid: res.flatten.count,
          ids_not_exits_on_parent: res.flatten.map&.id
      }
    end
    return {
        num_rows_invalid: res.flatten.count,
        ids_not_exits_on_parent: []
    }
  end

  # rubocop:disable Metrics/MethodLength
  def __get_row_not_exits_on_parent_tbl_link_types(link_types, is_third_party = false, third_party_id = false, return_data = false)
    # get list not exits on table parent etc: source_type or destination_type is 'URL' with table 'urls'
    # res = 0
    # puts res

    # if is_third_party
    #   res += Link.from("(#{Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, link_types, third_party_id).to_sql} UNION
    #     #{Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, link_types, third_party_id).to_sql}) AS links").count()
    # else # is FLOL
    #   res += Link.from("(#{Link.not_exits_on_tbl_calendarobjects_source(@user_id, link_types).to_sql} UNION
    #     #{Link.not_exits_on_tbl_calendarobjects_destination(@user_id, link_types).to_sql}) AS links").count()
    # end
    #
    # res
    # res = []
    links = []
    all_uid = []
    if is_third_party
      s3rd_src = Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, link_types, third_party_id)
      s3rd_src.each do |link_3rd|
        all_uid << link_3rd.source_id
        links << __params_get_calendar_objects_3rd_src(link_3rd)
      end
      des_3rd = Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, link_types, third_party_id)
      des_3rd.each do |link_3rd|
        all_uid << link_3rd.destination_id
        links << __params_get_calendar_objects_3rd_des(link_3rd)
      end
      links_rs = get_calendar_objects_3rd(links) || {}
      num_rows_invalid =  if links_rs['exits'].blank?
                            links_rs['exits'] = []
                            (s3rd_src.length + des_3rd.length)
                          else
                            ((s3rd_src.length + des_3rd.length) - links_rs['exits'].length)
                          end

      if return_data
        ids_not_exits_on_parent = []
        uids_not_exits = all_uid - links_rs['exits'].map(&:to_s)
        if uids_not_exits.present?
          ids_not_exits_on_parent = Link.where(user_id: @user_id)
                                        .where('source_id IN (:uid) OR destination_id IN (:uid)', {uid: uids_not_exits})
                                        .select(:id).map(&:id)
        end
        return {
            num_rows_invalid: num_rows_invalid,
            ids_not_exits_on_parent: ids_not_exits_on_parent || []
        }
      end

      return num_rows_invalid
    else # is FLOL
      # res << Link.from("(#{Link.not_exits_on_tbl_calendarobjects_source(@user_id, link_types).to_sql} UNION
      #   #{Link.not_exits_on_tbl_calendarobjects_destination(@user_id, link_types).to_sql}) AS links")
      flol_flol = Link.not_exits_on_tbl_calendarobjects_FLOL_FLOL(@user_id, link_types)
      flol_3rd = Link.not_exits_on_tbl_calendarobjects_FLOL_3rd(@user_id, link_types)
      flol_3rd.each do |link_3rd|
        all_uid << link_3rd.destination_id
        links << __params_get_calendar_objects_3rd_des(link_3rd)
      end
      s3rd_flol = Link.not_exits_on_tbl_calendarobjects_3rd_FLOL(@user_id, link_types)
      s3rd_flol.each do |link_3rd|
        all_uid << link_3rd.source_id
        links << __params_get_calendar_objects_3rd_src(link_3rd)
      end
      links_rs = get_calendar_objects_3rd(links) || {}
      num_rows_invalid =  if links_rs['exits'].blank?
                            links_rs['exits'] = []
                            (flol_flol.flatten.count + flol_3rd.length + s3rd_flol.length)
                          else
                            ((flol_flol.flatten.count + flol_3rd.length + s3rd_flol.length) - links_rs['exits'].length)
                          end

      if return_data
        ids_not_exits_on_parent = flol_flol.map(&:id)
        # ids_not_exits_on_parent = flol_flol.map { |r| r.attributes.symbolize_keys }
        uids_not_exits = all_uid - links_rs['exits'].map(&:to_s)
        if uids_not_exits.present?
          ids_not_exits_on_parent = Link.where(user_id: @user_id)
                                        .where('source_id IN (:uid) OR destination_id IN (:uid)', {uid: uids_not_exits})
                                        .select(:id).map(&:id)
        end
        return {
            num_rows_invalid: num_rows_invalid,
            ids_not_exits_on_parent: ids_not_exits_on_parent || []
        }
      end

      return num_rows_invalid
    end
    return -1
  end
  # rubocop:enable Metrics/MethodLength

  # return number row_not exits on parent tbl for notes
  #
  # @params is_third_party [true, false]
  # @params third_party_id [Integer] if is_third_party == true
  #
  # @returns [Array<Link>] return all row_not exits on parent tbl
  def __count_get_row_not_exits_on_parent_tbl_des(link_types, is_third_party = false, third_party_id = false, return_data = false)
    res = []
    if is_third_party
      res << Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, link_types, third_party_id)
    else # is FLOL
      res << Link.not_exits_on_tbl_calendarobjects_destination(@user_id, link_types)
    end

    if return_data
      return {
          num_rows_invalid: res.flatten.count,
          ids_not_exits_on_parent: res.flatten.map&.id
      }
    end
    return res.flatten.count
  end

  # return all row_not exits on parent tbl
  #
  # @param [true, false] is_third_party
  # @param [Integer] third_party_id if is_third_party == true
  #
  # @return [Array<Link>] return all row_not exits on parent tbl
  def __get_row_not_exits_on_parent_tbl(is_third_party = false, third_party_id = false, returnRes = true)
    # get list not exits on table parent etc: source_type or destination_type is 'URL' with table 'urls'
    res = []
    puts res.size

    if is_third_party
      res += Link.third_p_not_exits_on_projects_source(@user_id, third_party_id)
      res += Link.third_p_not_exits_on_projects_destination(@user_id, third_party_id)
      puts res.size

      res += Link.third_p_not_exits_on_urls_source(@user_id, third_party_id)
      res += Link.third_p_not_exits_on_urls_destination(@user_id, third_party_id)
      puts res.size

      res += Link.third_p_not_exits_on_cards_source(@user_id, third_party_id)
      res += Link.third_p_not_exits_on_cards_destination(@user_id, third_party_id)
      puts res.size

      # res += Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id)
      # res += Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id)
      # links_src = Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id)
      # ap links_src
      # links_des = Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id)
      # ap links_des
      # puts res.size
      link_types = %w[VEVENT VTODO VJOURNAL]
      if returnRes
        rs = __get_row_not_exits_on_parent_tbl_link_types(link_types, true, third_party_id, returnRes)
        num_rows_not_exits_on_parent = rs[:num_rows_invalid]
        ids_not_exits_on_parent = rs[:ids_not_exits_on_parent]
      else
        num_rows_not_exits_on_parent = __get_row_not_exits_on_parent_tbl_link_types(link_types, true, third_party_id)
      end
    else # is FLOL
      res += Link.not_exits_on_projects_source(@user_id)
      res += Link.not_exits_on_projects_destination(@user_id)
      puts res.size

      # id_check = []
      # # id_check = Link.pluck('distinct source_id').where(user_id:  @user_id)
      # # id_check = Link.where(user_id:  @user_id).joins(:link).pluck('distinct source_id')
      # links_source = Link.find_by_sql(["select distinct(source_id) from `links` WHERE `links`.`user_id` = ?;", @user_id])
      # links_destination = Link.find_by_sql(["select distinct(destination_id) from `links` WHERE `links`.`user_id` = ?;", @user_id])
      # id_check += links_source.map(&:source_id)
      # id_check += links_destination.map(&:destination_id)
      # # id_check = Link.distinct_source_id(@user_id).select(:source_id)
      # # id_check += Link.distinct_destination_id(@user_id).select(:source_id)
      # # puts id_check.length
      # id_check.uniq!
      # # puts id_check.length

      res += Link.not_exits_on_urls_source(@user_id)
      res += Link.not_exits_on_urls_destination(@user_id)
      puts res.size

      res += Link.not_exits_on_cards_source(@user_id)
      res += Link.not_exits_on_cards_destination(@user_id)
      puts res.size

      res += Link.not_exits_on_tbl_calendarobjects_source(@user_id, %w[VEVENT VTODO VJOURNAL])
      res += Link.not_exits_on_tbl_calendarobjects_destination(@user_id, %w[VEVENT VTODO VJOURNAL])
      puts res.size
    end
    puts res.size

    res
  end

  # rubocop:disable Metrics/MethodLength
  def get_calendar_objects_3rd(links)
    tp_links = []
    tp_data = []
    exits = []

    if links.present?
      # separate link from 3rd party account
      links_partition = links.partition do |x|
        x[:account_id] != '' && x[:account_id] != '0' && x[:type] != 'FOLDER' && x[:type] != 'EMAIL'
      end

      # case: partition return true array
      tp_links = links_partition[0]

      # case: partition return false array
      links = links_partition[1]
      links = links.group_by {|x| x[:type]}.except("FOLDER")

      # get 3rd party object
      if tp_links.any?
        # get data for 3rd object
        # TODO: get data of 3rd object by UID
        tp_data = __get_tp_link_data(tp_links)

        if tp_data.any?
          # tp_data.map {|x| x["type"] = x["itemType"] || x[:type]}
          tp_data = tp_data.each do |x|
            x['type'] = x['itemType'] || x[:type]
            uid = x['uid']
            if x['type'] == API_CONTACT_TYPE and x['data'].present?
              uid = x['data'].match(/UID:\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/).to_s.gsub(/UID:/, "")
            end
            exits << uid if uid.present?
            x
          end
        end
      end

      # get links data by its types & ids
      ids = []
      data = []
      links.each do |key, value|
        case key
        when 'VTODO', 'VJOURNAL', 'VEVENT', 'STODO'
          data.concat(__get_co_data(value))
        when 'VCARD'
          data.concat(__get_contact_data(value))
        when 'EMAIL'
          data.concat(__get_email_data(value))
        when 'URL'
          data.concat(__get_url_data(value))
        end
      end
      data.map! do |d|
        if d[:itemType].blank?
          d.merge({ :is_invalid => true})
        else
          d
        end
      end

      #include tp data
      data.concat(tp_data) if tp_data.any?

      # only get id in trash to check case (trashed)
      trash_ids = __get_trash_id
      data.push(trash_ids) if trash_ids

      # group link data by type
      data = data.group_by {|x| x['type']}
    end
    data['exits'] = exits if data.present?
    data
  end
  # rubocop:enable Metrics/MethodLength

  # return number row_not exits on parent tbl for projects, urls, cards and duplicate
  #
  # @param [TrueClass, FalseClass] is_third_party
  # @param [Integer] third_party_id if is_third_party == true
  #
  # @return [Array<Link>] return all row_not exits on parent tbl
  def __get_row_not_exits_on_parent_tbl_projs_urls_cards(is_third_party = false, third_party_id = false, return_data = true)
    # get list not exits on table parent etc: source_type or destination_type is 'URL' with table 'urls'
    res = 0
    puts res

    if is_third_party
      res += Link.from("(#{Link.third_p_not_exits_on_projects_source(@user_id, third_party_id).to_sql} UNION
        #{Link.third_p_not_exits_on_projects_destination(@user_id, third_party_id).to_sql}) AS links").count()

      res += Link.from("(#{Link.third_p_not_exits_on_urls_source(@user_id, third_party_id).to_sql} UNION
        #{Link.third_p_not_exits_on_urls_destination(@user_id, third_party_id).to_sql}) AS links").count()

      res += Link.from("(#{Link.third_p_not_exits_on_cards_source(@user_id, third_party_id).to_sql} UNION
        #{Link.third_p_not_exits_on_cards_destination(@user_id, third_party_id).to_sql}) AS links").count()
    else # is FLOL
      res += Link.from("(#{Link.not_exits_on_projects_source(@user_id).to_sql} UNION
        #{Link.not_exits_on_projects_destination(@user_id).to_sql}) AS links").count()

      res += Link.from("(#{Link.not_exits_on_urls_source(@user_id).to_sql} UNION
        #{Link.not_exits_on_urls_destination(@user_id).to_sql}) AS links").count()

      # res += Link.from("(#{Link.not_exits_on_cards_source(@user_id).to_sql} UNION
        #{Link.not_exits_on_cards_destination(@user_id).to_sql}) AS links").count()
      links_cards = Link.from("(#{Link.not_exits_on_cards_source(@user_id).to_sql} UNION
        #{Link.not_exits_on_cards_destination(@user_id).to_sql}) AS links")

      links = []
      links_cards.each do |link_3rd|
        links << __params_get_calendar_objects_3rd(link_3rd)
      end
      links_rs = get_calendar_objects_3rd(links) || {}
      # if links_rs['exits'].present?
      #   res += (links_cards.length - links_rs['exits'].length)
      # end
      res += (links_cards.length - (links_rs['exits'].present? ? links_rs['exits'].length : 0))
    end

    ids_not_exits_on_parent =
      if links_rs['exits'].blank?
        links_cards
      else
        links_cards.reject do |link|
          links_rs['exits'].include?(link[:source_id] || link[:destination_id])
        end
      end

    {
        num_rows_invalid: res,
        ids_not_exits_on_parent: return_data ? ids_not_exits_on_parent : []
    }
  end

  def __do_get_calobj_data(item)
    user_info = {
        :email => @email,
        :user_id => @user_id
    }
    objType = item["componenttype"]
    uid = item["uid"]

    if uid.present?
      uid = uid.split(',')
    end

    cal_objs = CalendarObject.get_calendar_objects(user_info, objType, uid, nil, nil)
    objs = Api::Web::Utils.convert_calendar_obj(cal_objs, false) if cal_objs
    # objs = {:data => [{}]}
    obj = objs[:data].first
  end

  # return number row_not exits on parent tbl
  #
  # @params is_third_party [true, false]
  # @params third_party_id [Integer] if is_third_party == true
  #
  # @returns [Array<Link>] return all row_not exits on parent tbl
  def __count_get_row_not_exits_on_parent_tbl(is_third_party = false, third_party_id = false)
    # get list not exits on table parent etc: source_type or destination_type is 'URL' with table 'urls'
    res = 0
    puts res

    if is_third_party
      # res += Link.third_p_not_exits_on_projects_source(@user_id, third_party_id).count()
      # res += Link.third_p_not_exits_on_projects_destination(@user_id, third_party_id).count()
      #
      # res += Link.third_p_not_exits_on_urls_source(@user_id, third_party_id).count()
      # res += Link.third_p_not_exits_on_urls_destination(@user_id, third_party_id).count()
      #
      # res += Link.third_p_not_exits_on_cards_source(@user_id, third_party_id).count()
      # res += Link.third_p_not_exits_on_cards_destination(@user_id, third_party_id).count()
      #
      # res += Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id).count()
      # res += Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id).count()

      res += Link.from("(#{Link.third_p_not_exits_on_projects_source(@user_id, third_party_id).to_sql} UNION
        #{Link.third_p_not_exits_on_projects_destination(@user_id, third_party_id).to_sql}) AS links").count()

      res += Link.from("(#{Link.third_p_not_exits_on_urls_source(@user_id, third_party_id).to_sql} UNION
        #{Link.third_p_not_exits_on_urls_destination(@user_id, third_party_id).to_sql}) AS links").count()

      # res += Link.from("(#{Link.third_p_not_exits_on_cards_source(@user_id, third_party_id).to_sql} UNION
      #   #{Link.third_p_not_exits_on_cards_destination(@user_id, third_party_id).to_sql}) AS links").count()
      links_cards = Link.from("(#{Link.third_p_not_exits_on_cards_source(@user_id, third_party_id).to_sql} UNION
        #{Link.third_p_not_exits_on_cards_destination(@user_id, third_party_id).to_sql}) AS links")

      # res += Link.from("(#{Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id).to_sql} UNION
      #   #{Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id).to_sql}) AS links").count()
      links_src = Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, %w[VEVENT VTODO VJOURNAL], third_party_id)
      links_des = Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, %w[VEVENT VTODO VJOURNAL], third_party_id)
      links = []

      links_cards.each do |link_3rd|
        links << __params_get_calendar_objects_3rd(link_3rd)
      end
      links_src.each do |link_3rd|
        links << __params_get_calendar_objects_3rd_src(link_3rd)
      end
      links_des.each do |link_3rd|
        links << __params_get_calendar_objects_3rd_des(link_3rd)
      end
      links_rs = get_calendar_objects_3rd(links) || {}
      if links_rs['exits'].present?
        res += ((links_cards.length + links_src.length + links_des.length) - links_rs['exits'].length)
      end
    else # is FLOL
      # res += Link.not_exits_on_projects_source(@user_id).count()
      # res += Link.not_exits_on_projects_destination(@user_id).count()
      #
      # res += Link.not_exits_on_urls_source(@user_id).count()
      # res += Link.not_exits_on_urls_destination(@user_id).count()
      #
      # res += Link.not_exits_on_cards_source(@user_id).count()
      # res += Link.not_exits_on_cards_destination(@user_id).count()
      #
      # res += Link.not_exits_on_tbl_calendarobjects_source(@user_id, %w(VEVENT VTODO VJOURNAL)).count()
      # res += Link.not_exits_on_tbl_calendarobjects_destination(@user_id, %w(VEVENT VTODO VJOURNAL)).count()

      res += Link.from("(#{Link.not_exits_on_projects_source(@user_id).to_sql} UNION
        #{Link.not_exits_on_projects_destination(@user_id).to_sql}) AS links").count()

      res += Link.from("(#{Link.not_exits_on_urls_source(@user_id).to_sql} UNION
        #{Link.not_exits_on_urls_destination(@user_id).to_sql}) AS links").count()


      res += Link.from("(#{Link.not_exits_on_cards_source(@user_id).to_sql} UNION
        #{Link.not_exits_on_cards_destination(@user_id).to_sql}) AS links").count()
      # links_cards = Link.from("(#{Link.not_exits_on_cards_source(@user_id).to_sql} UNION
      #   #{Link.not_exits_on_cards_destination(@user_id).to_sql}) AS links")
      #
      # links_cards.each do |link_3rd|
      #   links << __params_get_calendar_objects_3rd_des(link_3rd)
      # end

      res += Link.from("(#{Link.not_exits_on_tbl_calendarobjects_source(@user_id, %w[VEVENT VTODO VJOURNAL]).to_sql} UNION
        #{Link.not_exits_on_tbl_calendarobjects_destination(@user_id, %w[VEVENT VTODO VJOURNAL]).to_sql}) AS links").count()
    end
    puts res

    res
  end

  def __search_cal(qs)
    data = []
    cal_objs = CalendarObject.search_co_by_qs(qs, @email)
    # get data of each calObj
    cal_objs.each do |x|
      cal_obj_data = __do_get_calobj_data(x)
      if (cal_obj_data["itemType"] == "VJOURNAL" && cal_obj_data["notecontent"].present?)
        # only decode for note content
        cal_obj_data["notecontent"] = Base64.decode64(cal_obj_data["notecontent"])
      end

      # have to merge to get color, icon, summary of calendar object
      data.push(cal_obj_data.merge(x))
    end
    data
  end

  def __search_contact(qs)
    Cards.seach_contact_by_qs(qs.downcase, @email)
  end

  def __get_email_data(items)
    msg = {}
    ids = []
    data = []

    # convert hash key to string
    items.each do |v|
      msg = v.stringify_keys
      data.push(msg)
    end

    data
  end

  # search link section ========================================================
  def __search_url(qs)
    data = []
    Url.where('user_id = ? AND (url like ? or title like ?)', @user_id, '%' + qs + '%', '%' + qs + '%')
        .map do |x|
      bm = {}
      bm["uid"] = x[:id]
      bm["url"] = x[:url]
      bm["title"] = x[:title]
      bm["itemType"] = "URL"
      bm["type"] = "URL"
      data.push(bm)
    end
    data
  end

  def __get_contact_data(items)
    ids = []

    items.each do |v|
      ids.push(v[:id])
    end

    Cards.get_card_data(ids, @email)
  end

  # delete all row_not exits on parent tbl
  #
  # @params is_third_party [true, false]
  # @params third_party_id [Integer] if is_third_party == true
  #
  # @returns [Array<Link>] return all row_not exits on parent tbl
  def __del_get_row_not_exits_on_parent_tbl(is_third_party = false, third_party_id = false)
    # get list not exits on table parent etc: source_type or destination_type is 'URL' with table 'urls'
    res = []
    puts res.size

    if is_third_party
      # res += Link.third_p_not_exits_on_projects_source(@user_id, third_party_id)
      # res += Link.third_p_not_exits_on_projects_destination(@user_id, third_party_id).delete_all
      # puts res.size
      #
      # res += Link.third_p_not_exits_on_urls_source(@user_id, third_party_id).delete_all
      # res += Link.third_p_not_exits_on_urls_destination(@user_id, third_party_id).delete_all
      # puts res.size
      #
      # res += Link.third_p_not_exits_on_tbl_calendarobjects_source(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id).delete_all
      # res += Link.third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, %w(VEVENT VTODO VJOURNAL), third_party_id).delete_all
      # puts res.size

      Link.del_third_p_not_exits_on_projects_source(@user_id, third_party_id)
      Link.del_third_p_not_exits_on_projects_destination(@user_id, third_party_id)

      Link.del_third_p_not_exits_on_urls_source(@user_id, third_party_id)
      Link.del_third_p_not_exits_on_urls_destination(@user_id, third_party_id)

      Link.del_third_p_not_exits_on_cards_source(@user_id, third_party_id)
      Link.del_third_p_not_exits_on_cards_destination(@user_id, third_party_id)

      Link.del_third_p_not_exits_on_tbl_calendarobjects_source(@user_id, %w[VEVENT VTODO VJOURNAL], third_party_id)
      Link.del_third_p_not_exits_on_tbl_calendarobjects_destination(@user_id, %w[VEVENT VTODO VJOURNAL], third_party_id)
    else # is FLOL
      # res += Link.not_exits_on_projects_source(@user_id).delete_all()
      # res += Link.not_exits_on_projects_destination(@user_id).delete_all
      # puts res.size
      #
      # res += Link.not_exits_on_urls_source(@user_id).delete_all
      # res += Link.not_exits_on_urls_destination(@user_id).delete_all
      # puts res.size
      #
      # res += Link.not_exits_on_cards_source(@user_id).delete_all
      # res += Link.not_exits_on_cards_destination(@user_id).delete_all
      # puts res.size
      #
      # res += Link.not_exits_on_tbl_calendarobjects_source(@user_id, %w(VEVENT VTODO VJOURNAL)).delete_all
      # res += Link.not_exits_on_tbl_calendarobjects_destination(@user_id, %w(VEVENT VTODO VJOURNAL)).delete_all
      # puts res.size

      Link.del_not_exits_on_projects_source(@user_id)
      Link.del_not_exits_on_projects_destination(@user_id)

      Link.del_not_exits_on_urls_source(@user_id)
      Link.del_not_exits_on_urls_destination(@user_id)

      # Link.del_not_exits_on_cards_source(@user_id)
      # Link.del_not_exits_on_cards_destination(@user_id)
      links_cards = Link.from("(#{Link.not_exits_on_cards_source(@user_id).to_sql} UNION
        #{Link.not_exits_on_cards_destination(@user_id).to_sql}) AS links")

      links = []
      links_ids_all = []
      links_cards.each do |link_3rd|
        links << __params_get_calendar_objects_3rd(link_3rd)
        links_ids_all << (link_3rd.source_id || link_3rd.destination_id)
      end
      links_rs = get_calendar_objects_3rd(links) || {}

      links_ids_not_exits = []
      if links_rs['exits'].present?
        links_ids_not_exits = links_ids_all - links_rs['exits']
      end
      Link.del_not_exits_on_cards(@user_id, links_ids_not_exits) if links_ids_not_exits.present?

      # Link.del_not_exits_on_tbl_calendarobjects_source(@user_id, %w(VEVENT VTODO VJOURNAL))
      # Link.del_not_exits_on_tbl_calendarobjects_destination(@user_id, %w(VEVENT VTODO VJOURNAL))
      # already seen delete on controller because use 2 fucn dont check iclould, google
    end
    puts res.size

    res
  end

  def __get_trash_id
    trash_ids = Trash.select(:obj_id).where(user_id: @user_id).map(&:obj_id)
    if trash_ids.any?
      items = {}
      # add type to separate trash with another object
      items["type"] = "trash"
      items["ids"] = trash_ids
      items
    end
  end

  # remove all rows same, keep 1 row on DB
  # @params user_id
  def __remove_rows_duplicate(user_id)
    sql = <<-SQL
      delete n1
      FROM `links` as n1, `links` as n2 
      WHERE
      n1.user_id = #{user_id} AND
      n1.id < n2.id AND 
      n1.source_id = n2.source_id AND 
      n1.destination_id = n2.destination_id AND 
      n1.user_id = n2.user_id AND
      n1.source_type = n2.source_type AND
      n1.destination_type = n2.destination_type
    SQL
    Link.find_by_sql sql
  end

  # only row duplicate
  # get all on table left ( all id on table left < id on table right - 4 field equal) some row same when use Descartes
  def __count_rows_duplicate(user_id)
    sql = <<-SQL
      select
      n1.id
      -- count(*) as num_dup -- don't use because field same all, when greater than 2 row
      -- n1.id, n1.source_type, n1.destination_type, n1.user_id, n1.source_id, n1.destination_id,
      -- n2.id as id2, n2.source_type as st, n2.destination_type as dt, n2.user_id as ui, n2.source_id as si, n2.destination_id  as di
      FROM `links` as n1, `links` as n2 
      WHERE
      n1.user_id = #{user_id} AND
      n1.id < n2.id AND 
      n1.source_id = n2.source_id AND 
      n1.destination_id = n2.destination_id AND 
      n1.user_id = n2.user_id AND
      n1.source_type = n2.source_type AND
      n1.destination_type = n2.destination_type
    SQL
    rows_after_descartes = Link.find_by_sql sql
    rows_after_descartes.map(&:id).uniq # don't use uniq! error when 1 value return nil
  end

  # rubocop:disable Metrics/MethodLength, Metrics/BlockLength
  def __get_tp_link_data(tp_links)
    data = []

    tp_links.each do |x|
      # get authen token, account type, password for 3rd account
      acc = SetAccount.where(id: x[:account_id]).first

      x[:auth_token] = acc[:auth_token]
      x[:account_type] = acc[:account_type]
      x[:user_income] = acc[:user_income]
      x[:pass_income] = acc[:pass_income]

      if !acc[:account_sync].empty?
        x[:account_sync] = JSON.parse(acc[:account_sync])
      end

      case x[:account_type]
      when 1
        # google link return {event}
        if x[:auth_token].empty?
          # thirdparty account is inactive in other platform
          x[:inactive] = true
          data.push(x)
        elsif x[:account_sync]['Calendar'] == 0 && x[:type] == "VEVENT"
          # turn off sync calendar option
          x[:inactive] = true
          data.push(x)
        else
          # compact to delete nil object in array
          begin
            data.push(get_google_object(x)).compact
          rescue
            data.push({
                          uid: x[:id],
                          itemType: x[:type],
                          type: x[:type],
                          error: true
                      }).compact
          end
        end
      when 2
        # yahoo link return [event, todo]
        if x[:pass_income].empty?
          # thirdparty account is inactive in other platform
          x[:inactive] = true
          data.push(x)
        elsif x[:account_sync]['Calendar'] == 0 && (x[:type] == "VEVENT" || x[:type] == "VTODO")
          # turn off sync calendar option
          x[:inactive] = true
          data.push(x)
        else
          yahoo_objs = get_yahoo_object(x)
          if !yahoo_objs.nil?
            data.concat(yahoo_objs)
          end
        end
      when 5
        # icloud link return [event, todo, contact]
        if x[:pass_income].empty?
          # thirdparty account is inactive in other platform
          x[:inactive] = true
          data.push(x)
        elsif x[:account_sync]['Calendar'] == 0 && (x[:type] == "VEVENT" || x[:type] == "VTODO")
          # turn off sync calendar option
          x[:inactive] = true
          data.push(x)
        elsif x[:account_sync]['Contact'] == 0 && x[:type] == "VCARD"
          # turn off sync contact option
          x[:inactive] = true
          data.push(x)
        else
          icloud_objs = get_icloud_object(x)
          if !icloud_objs.nil?
            data.concat(icloud_objs)
          end
        end
      end
    end

    data
  end
  # rubocop:enable Metrics/MethodLength, Metrics/BlockLength

  def __get_url_data(items)
    # convert hash key to string
    # ids = []
    data = []

    items.each do |v|
      # format data of bookmark
      # bm = {uid: x, itemType: "x", title: "x", url: "x", type: "x"}
      bm = {}
      Url.where(user_id: @user_id, id: v[:id].to_i).each do |x|
        bm["uid"] = x[:id]
        bm["url"] = x[:url]
        bm["title"] = x[:title].blank? ? x[:url].gsub(/http:\/\//, "").gsub(/https:\/\//, "") : x[:title]
        bm["itemType"] = "URL"
        bm["type"] = "URL"
      end
      if bm.blank?
        bm["uid"] = v[:id].to_i
        bm["itemType"] = ""
        bm["type"] = ""
        ap v
      end
      data.push(bm)
    end

    data
  end

  def __params_get_calendar_objects_3rd_des(link_3rd)
    {
        id:         link_3rd.destination_id,
        type:       link_3rd.destination_type,
        account_id: link_3rd.destination_account,
        root_id:    link_3rd.destination_root_uid
    }
  end

  def __params_get_calendar_objects_3rd(link_3rd)
    {
        id:         link_3rd.source_id || link_3rd.destination_id,
        type:       link_3rd.source_type || link_3rd.destination_type,
        account_id: link_3rd.source_account || link_3rd.destination_account,
        root_id:    link_3rd.source_root_uid || link_3rd.destination_root_uid
    }
  end

  def __params_get_calendar_objects_3rd_src(link_3rd)
    {
        id:         link_3rd.source_id,
        type:       link_3rd.source_type,
        account_id: link_3rd.source_account,
        root_id:    link_3rd.source_root_uid
    }
  end

  def links_params
    params.permit(links: [:id, :source_type, :destination_type, :source_account, :destination_account,
                          :source_id, :destination_id, :email, :source_root_uid, :ref,
                          :destination_root_uid, meta_data: [source: [:message_id, :subject, :from, :sent_time, :received_time, to: [], cc: [], bcc: []],
                                                             destination: [:message_id, :subject, :from, :to, :sent_time, :received_time, to: [], cc: [], bcc: []]]])
          .require(:links)
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user.id,
                                 item_type: API_LINK.to_s)
  end

  def project_ids_authorized
    project_ids = []
    projects_params.each do |project_id|
      project = Project.find_by(id: project_id) || Project.new
      authorize project, :member?

      project_ids << project.id
    end
    project_ids
  end

  def projects_params
    params.permit(project_ids: []).require(:project_ids)
  end

  def limit_params
    if params.required(:links).size > API_LIMIT_PARAMS
      return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
    end
  end
end
