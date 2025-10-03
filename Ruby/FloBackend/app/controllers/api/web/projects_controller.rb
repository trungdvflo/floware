require "./lib/app_utils.rb"

class Api::Web::ProjectsController < Api::Web::BaseController
  include AppUtils

  EXCEPT_FIELDS = [:user_id]

  # rubocop:disable Metrics/BlockLength, Metrics/MethodLength
  # delete a specific folders by ids or all folders and associated objects
  def destroy_all
    req_ids = params[:ids]
    # For get object (todo, note, event, folder) delete
    # req_ids_rm_all = []
    # req_ids.each do |req_id|
    #   req_ids_rm_data = {}
    #   req_ids_rm = find_children_new(req_id)
    #   req_ids_rm_data["id"] = req_id
    #   req_ids_rm_data["data"] = req_ids_rm.flatten()
    #   req_ids_rm_all << req_ids_rm_data
    # end
    # render json: req_ids_rm_all.to_json
    req_ids_rm_all = []
    # if req_ids.blank?
    #   respond = { :success => API_ITEM_NOT_EXIST, :changed_calobj_types => {}, :changed_uids => [], :changed_cals => [], :sub_col_uid => [] }
    #   respond_to do |format|
    #     format.json { render :json => respond }
    #   end
    #   return
    # end

    user_folders = Project.where(user_id: @user_id)

    if req_ids.present?
      req_ids.each do |req_id|
        req_ids_rm = find_children_new(req_id)
        req_ids_rm_all << req_ids_rm
      end
      req_ids_rm_all = req_ids_rm_all.flatten.uniq

      del_folders = user_folders.where(id: req_ids)

      sub_col_uid = req_ids_rm_all.map { |id| req_ids.include?(id) ? nil : id }.compact
    else # empty trash
      trash_ids = Trash.select(:obj_id).where(user_id: @user_id, obj_type: API_FOLDER).map(&:obj_id)
      del_folders = Project.where(id: trash_ids)
      req_ids_rm_all = del_folders.map { |x| x.id }
    end

    changed_calobj_types = {}
    # collect old and new uid of calendar object
    changed_uids = []
    changed_cals = []

    if del_folders.present?
      fol_ids = req_ids_rm_all # del_folders.map { |x| x.id }
      ActiveRecord::Base.transaction do
        # delete folders in trash then save them to deleted_item
        d_items = Trash.where(user_id: @user_id, obj_id: fol_ids).destroy_all
        d_items.each { |x| save_delete_item(API_TRASH, x.id) }

        # delete in other tables
        d_items_kb = Kanban.where(user_id: @user_id, project_id: fol_ids)
        d_items_kb.each { |x| save_delete_item(API_KANBAN, x.id) }
        d_items_kb.delete_all
        d_items_canvas = Canvas.where(user_id: @user_id, collection_id: fol_ids)
        d_items_canvas.each { |x| save_delete_item(API_CANVAS_TYPE, x.id) }
        d_items_canvas.delete_all
        d_items.each { |x| save_delete_item(API_FOLDER, x.obj_id) }
        # d_items_proj = Project.where(user_id: @user_id, id: fol_ids).delete_all

        # delete and change calendars
        cal_uris = del_folders.map { |x| x.calendar_id }

        if cal_uris.present?
          del_cals = Calendar.where(uri: cal_uris)

          if del_cals.present?
            calobjs = CalendarObject.where(calendarid: del_cals.map { |x| x.id })

            # key: folder id, value: matched calendar uri
            fol_cal_hash = user_folders.each_with_object({}) do |fol, hash|
              matched_cal = Calendar.where(uri: fol.calendar_id).first
              if matched_cal
                hash[fol.id] = matched_cal.uri
              end
            end

            setting = Setting.where(user_id: @user_id).first
            omni_cal_uri = setting.omni_cal_id

            calobjs.each do |co|
              cal_changed = false
              # old_id = co.id
              old_uid = co.uid
              new_uid = UUID.new.generate

              new_data = co.calendardata.sub(old_uid, new_uid)

              # collect old_uid and new_uid then push to changed_uids
              group_uid = {
                "old_uid" => old_uid,
                "new_uid" => new_uid
                }
              changed_uids.push(group_uid)

              # calobj_links = Link.where(["user_id = ? AND ((source_id IN (?) AND destination_type = '#{API_FOLDER}')
              #     OR (destination_id IN (?) AND source_type = '#{API_FOLDER}'))", @user_id, old_uid, old_uid])
              sql = <<-SQL
                user_id = ? AND ((source_id = ? AND destination_type = '#{API_FOLDER}' AND destination_id NOT IN (?))
                OR (destination_id = ? AND source_type = '#{API_FOLDER}' AND source_id NOT IN (?)))
              SQL
              calobj_links = Link.where([sql, @user_id, old_uid, fol_ids, old_uid, fol_ids])

              # calender is determined
              if calobj_links.size == 1
                link = calobj_links.first
                next_fol_id = link.source_type == API_FOLDER ? link.source_id : link.destination_id
                new_cal_uri = fol_cal_hash[next_fol_id.to_i]

                if new_cal_uri
                  __create_calobj(new_uid, new_data, new_cal_uri)

                  changed_cals.push({:uid => new_uid, :new_cal => new_cal_uri})
                  cal_changed = true
                end
              end

              # otherwise, move to omni
              if !cal_changed and omni_cal_uri
                __create_calobj(new_uid, new_data, omni_cal_uri)
                changed_cals.push({:uid => new_uid, :new_cal => omni_cal_uri})
              end

              # get order of TODO
              if co.componenttype == "VTODO"
                order_record_id = ObjOrder.where(obj_id: old_uid).first.id
                # new_calobj_id = CalendarObject.last.uid
                # new_calobj_id = CalendarObject.last.id
                # update obj_id of old TODO to new TODO
                # ObjOrder.update(order_record_id, :obj_id => new_calobj_id)
                ObjOrder.update(order_record_id, :obj_id => new_uid)
              end

              # find the new object in the link table to update
              calobj_links.each do |l|
                if l.source_type == API_FOLDER
                  l.destination_id = new_uid
                else
                  l.source_id = new_uid
                end
                l.save
              end

              # update trash
              Trash.where(user_id: @user_id, obj_id: old_uid).each do |t|
                t.obj_id = new_uid
                t.save
              end

              # update canvas
              Canvas.where(user_id: @user_id, item_id: old_uid).each do |c|
                c.item_id = new_uid
                c.save
              end

              # update todo order
              # already dissolubility
              # if co.componenttype == API_VTODO
              #   order_todo = setting.order_todo
              # 
              #   if order_todo
              #     begin
              #       orders = JSON.parse(order_todo)
              # 
              #       orders.each do |o|
              #         if o['uid'] == old_uid
              #           o['uid'] = new_uid
              #         end
              #       end
              # 
              #       setting[:order_todo] = orders.to_json
              #       setting.save
              #     rescue
              #     end
              #   end
              # end

              # indicate which view to refresh in client
              case co.componenttype
              when API_VEVENT
                changed_calobj_types[:event] = true
              when API_VTODO
                changed_calobj_types[:todo] = true
              when API_VJOURNAL
                changed_calobj_types[:note] = true
              end
            end

            unless fol_ids.blank?
              links = Link.where(["user_id = ? AND (source_id IN (?) OR destination_id IN (?))", @user_id, fol_ids, fol_ids])
              links.each { |x| save_delete_item(API_LINK, x.id) }
              links.delete_all
            end

            # do delete on the caldav server
            cal_uris.each { |uri| __delete_cal(uri) }
          end

          if del_folders.present?
            del_folders.destroy_all
          end
        end
      end
    end

    respond = { :success => true, :changed_calobj_types => changed_calobj_types, :changed_uids => changed_uids, :changed_cals => changed_cals, :sub_col_uid => sub_col_uid || [] }
    respond_to do |format|
      format.json { render :json => respond }
    end
  end
  # rubocop:enable Metrics/BlockLength, Metrics/MethodLength
  
  # return an array of all parents' id associated with the requested folder
  def find_flat_tree
    folder_id = params[:folder_id].to_i
    folder = Project.where(id: folder_id).first
    trash_ids = Trash
      .where({ user_id: @user_id })
      .select { |t| t.obj_type == 'FOLDER' }
      .map { |t| t.obj_id.to_i }
    respond_to do |format|
      if !folder
        format.json { render :json => { error: "folder does not exist" } }
      else
        tree_ids = find_parents(trash_ids, folder[:parent_id]).concat([folder[:id]])
        format.json { render :json => { tree_ids: tree_ids } }
      end
    end
  end

  # private

  # TODO: refactor!!!
  def find_parents(trash_ids, parent_id)
    parent_id = trash_ids.find { |x| x == parent_id }
    if (!parent_id) 
      []
    else
      p_parent_id = parent_folder(parent_id).parent_id
      [parent_id].concat(find_parents(trash_ids, p_parent_id)) 
    end
  end

  # restoring a parent collection will not restore sub-collections
  # https://www.pivotaltracker.com/n/projects/1215470/stories/103384592
  # def find_children(trash_ids, cur_id)
  #   id = trash_ids.find { |x| x == cur_id }
  #   if (!id)
  #     []
  #   else
  #     sub_folders(cur_id)
  #       .map do |x|
  #         find_children(trash_ids, x[:id])
  #       end
  #       .flatten()
  #       .concat([id]);
  #   end
  # end
  def find_children_new(cur_id)
    cur = []
    cur << cur_id
    cur << sub_folders(cur_id).map do |x|
      find_children_new(x.blank? ? [] : x[:id])
    end
  end

  def parent_folder(parent_id)
    Project
      .where('user_id = ? and id = ?', @user_id, parent_id)
      .first
  end

  def sub_folders(id)
    Project
      .where('user_id = ? and parent_id = ?', @user_id, id)
  end
end
