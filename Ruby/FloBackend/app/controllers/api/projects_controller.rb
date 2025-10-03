require "./lib/app_utils.rb"

class Api::ProjectsController < Api::BaseController
  include AppUtils
  include Pundit 
  before_action :limit_params, only: [:create, :update]

  def index
    @current_user = current_user
    @projects = Project.includes(:owner).where(id: current_user.all_projects.map(&:id))
                       .with_modifiedGTE(params[:modifiedGTE])
                       .with_modifiedLT(params[:modifiedLT])
                       .with_ids(params[:ids])
                       .with_min_id(params[:minID])
                       .with_p_item(params[:pItem])
                       .with_fields(params[:fields])
    if params[:has_del].to_i == 1
      @projects_deleted = DeletedItem.where(user_id: current_user.id, item_type: API_FOLDER)
                                     .with_modifiedGTE(params[:modifiedGTE])
                                     .with_modifiedLT(params[:modifiedLT])
                                     .with_ids(params[:ids])
                                     .with_min_id(params[:minDelID])
                                     .with_p_item(params[:pItem])
    end
    has_trash = params[:has_trash]
    if has_trash
      # add "is_trash" to projects that are currently in trash
      trash_ids = Trash.where({ user_id: current_user.id })
                       .select { |t| t.obj_type == 'FOLDER' }
                       .map { |t| t.obj_id.to_i }
      projs_has_trash = @projects.has_trash trash_ids
      projs_not_trash = @projects.not_trash trash_ids
      @projects = projs_has_trash + projs_not_trash
    end
  end

  def create
    @projects = []
    @projects_errors = []

    params[:projects].each do |project_hash|
      if project_hash[:proj_type].to_i == Project::SHARED and maximum_shared_collection?
        @projects_errors << { error: API_ITEM_CANNOT_SAVE,
                              attributes: project_hash,
                              description: MSG_LIMITED_SHARED_COLLECTION }
        next
      end
      project = current_user.projects.new project_hash.permit!.except(:id)
      if project_hash[:calendar_id].blank?
        project.calendar_id = UUID.new.generate
      elsif Project.find_by(calendar_id: project_hash[:calendar_id]).present?
        @projects_errors << { error: API_ITEM_CANNOT_SAVE,
                              attributes: project_hash,
                              description: 'Calendar is linked with another project' }
        next
      end

      if valid_json? project_hash[:alerts].to_json
        project.alerts = project_hash[:alerts].to_json
      end

      begin
        if project.save
          @projects << project
        else
          @projects_errors << { error: API_ITEM_CANNOT_SAVE,
                                attributes: project_hash,
                                description: project.errors.full_messages.join(',') }
        end
      rescue
        @projects_errors << { error: API_ITEM_CANNOT_SAVE,
                              attributes: project_hash,
                              description: MSG_ERR_NOT_SAVED }
      end
    end
  end

  def update
    @projects = []
    @projects_errors = []

    params[:projects].each do |project_hash|
      project = Project.find_by(id: project_hash[:id]) || Project.new
      authorize project, :owner_or_member?
    end

    params[:projects].each do |project_hash|
      project = Project.find_by(id: project_hash[:id])

      # Member can't rename shared collection
      project_hash.delete(:proj_name) unless owner?(project)

      if project.proj_type != Project::SHARED and project_hash[:parent_id].present?
        project.parent_id = project_hash[:parent_id] 
      end

      # !project_hash[:alerts].nil? -> alerts could be an empty array 
      if !project_hash[:alerts].nil? and valid_json? project_hash[:alerts].to_json
        project.alerts = project_hash[:alerts].to_json
      end

      begin
        # Shared collections can not be changed to private collection or vice versa.
        # Cannot change existing collection to Shared Collection
        project.assign_attributes project_hash.permit!.except(:id, :parent_id, :alerts)
        if project.save
          @projects << project
        else
          @projects_errors << { error: API_ITEM_CANNOT_SAVE,
                                attributes: project_hash,
                                description: project&.errors&.full_messages.join(',') || MSG_ERR_NOT_SAVED }
        end
      rescue
        @projects_errors << { error: API_ITEM_CANNOT_SAVE,
                              attributes: project_hash,
                              description: MSG_ERR_NOT_SAVED }
      end
    end
  end

  def update_personal_setting
    @projects_users = []
    @projects_users_errors = []

    projects_users_params.each do |project_user_hash|
      project = Project.find_by(id: project_user_hash[:project_id], proj_type: Project::SHARED) || Project.new
      authorize project, :member?
    end

    projects_users_params.each do |project_user_hash|
      project_user = ProjectsUser.find_by(project_id: project_user_hash[:project_id],
                                          user_id: current_user.id)
      if project_user&.update_attributes project_user_hash.except(:status, :permission, :id)
        @projects_users << project_user
      else
        @projects_users_errors << { error: API_ITEM_CANNOT_SAVE,
                                    attributes: project_user_hash,
                                    description: project_user.errors.full_messages.join(',') }
      end
    end
  end

  # rubocop:disable Metrics/BlockLength
  def invite
    @projects_users = []
    @projects_users_errors = []

    @projects_cards = []
    @projects_cards_errors = []

    projects_users_params.each do |project_user_hash|
      project = Project.find_by(id: project_user_hash[:project_id], proj_type: Project::SHARED) || Project.new
      authorize project, :owner?
    end

    projects_users_params.each do |project_user_hash|
      ActiveRecord::Base.transaction do
        project_card = ProjectsCard.new(project_id: project_user_hash[:project_id],
                                        card_uid: project_user_hash[:card_uid],
                                        href: project_user_hash[:href],
                                        set_account_id: project_user_hash[:set_account_id])
        if project_card.save
          @projects_cards << project_card
        else
          @projects_cards_errors << { error: API_ITEM_CANNOT_SAVE,
                                      attributes: project_user_hash,
                                      description: project_card.errors.full_messages.join(',') }
          raise ActiveRecord::Rollback
        end

        unless flo_email?(project_user_hash[:email])
          next
        end

        user = User.find_by(email: project_user_hash[:email])

        # not allow add my self
        next if user&.id == current_user.id

        project_user = ProjectsUser.new(project_id: project_user_hash[:project_id],
                                        user_id: user&.id)
        if project_user.save
          @projects_users << project_user
        else
          @projects_users_errors << { error: API_ITEM_CANNOT_SAVE,
                                      attributes: project_user_hash,
                                      description: project_user.errors.full_messages.join(',') }
          raise ActiveRecord::Rollback
        end
      end
    end
  end
  # rubocop:enable Metrics/BlockLength

  def accept_invite
    @projects_users = []
    @projects_users_errors = []

    projects_params.each do |project_hash|
      project = Project.find_by(id: project_hash[:id], proj_type: Project::SHARED)
      next if project.blank?
      project_user = ProjectsUser.find_by(project_id: project.id,
                                          user_id: current_user.id) || ProjectsUser.new
      if project_user.accepted?
        @projects_users << project_user
      else
        @projects_users_errors << { error: API_ITEM_NOT_EXIST,
                                    description: MSG_ERR_NOT_EXIST,
                                    attributes:  project_hash }
      end
    end
  end

  def remove_members
    @projects_users = []
    @projects_users_errors = []

    @projects_cards = []
    @projects_cards_errors = []

    projects_users_params.each do |project_user_hash|
      project = Project.find_by(id: project_user_hash[:project_id], proj_type: Project::SHARED) || Project.new
      authorize project, :owner?
    end

    projects_users_params.each do |project_user_hash|
      project = Project.find_by(id: project_user_hash[:project_id])
      ActiveRecord::Base.transaction do
        project_card = ProjectsCard.find_by(project: project, card_uid: project_user_hash[:card_uid])
        if project_card&.delete
          @projects_cards << project_card
        else
          @projects_cards_errors << { error: API_ITEM_NOT_EXIST,
                                      description: MSG_ERR_NOT_EXIST,
                                      attributes: project_user_hash }
          raise ActiveRecord::Rollback
        end

        # remove by email
        user = User.find_by(email: project_user_hash[:email])
        unless user
          next
        end

        project_user = ProjectsUser.find_by(project: project, user_id: user&.id)
        if project_user&.delete
          # send_email_remove_member_from_collection(user.email, project)
          @projects_users << project_user
        else
          @projects_users_errors << { error: API_ITEM_NOT_EXIST,
                                      description: MSG_ERR_NOT_EXIST,
                                      attributes: project_user_hash }
          raise ActiveRecord::Rollback
        end
      end
    end
  end

  def destroy
    @deleted_ids = []
    @projects_errors = []

    projects_params.each do |project_hash|
      project = current_user.projects.find_by(id: project_hash[:id])

      if project
        setting = Setting.find_by(user_id: current_user.id)
        if setting&.default_folder.to_i == project.id
          @projects_errors << { error: API_ITEM_CANNOT_DELETE,
                                description: 'Can not delete default collection',
                                id: project_hash[:id] }
          next
        end

        project.destroy
        @deleted_ids << project.id
        # send_email_delete_collection(project)
      else
        @projects_errors << { error: API_ITEM_NOT_EXIST,
                              description: MSG_ERR_NOT_EXIST,
                              id: project_hash[:id] }
      end
    end
    deleted_item_service(ids: @deleted_ids).execute
  end

  def members
    @shared_projects = current_user.projects
                                   .where(id: project_ids_params, proj_type: Project::SHARED)
                                   .includes(:projects_cards, projects_users: [:user])
  end

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

  private

  def maximum_shared_collection?
    # STANDARD = '0', PREMIUM = '1', PRO = '2'
    limit_shared_collection = { 0 => '3', 1 => '10', 2 => '-1' }
    subscription_type = current_user.current_subscription&.subs_type || 0

    return false if limit_shared_collection[subscription_type].to_i == -1
    return false if current_user.projects.where(proj_type: Project::SHARED).count < limit_shared_collection[subscription_type].to_i
    true
  end

  def flo_email?(email)
    email&.split('@')&.last == EMAIL_MATCHER
  end

  def owner?(project)
    project.owner.id == current_user.id
  end

  def limit_params
    if params.required(:projects).size > API_LIMIT_PARAMS
      return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
    end
  end

  # def send_email_delete_collection(project)
    # Thread.new do
      # project.members do |member|
        # UserMailer.delete_collection(member.email, project.proj_name)
      # end
    # end
  # end

  # def send_email_remove_member_from_collection(to_email, project)
    # Thread.new { UserMailer.remove_member_from_collection(to_email, project.proj_name) }
  # end

  def projects_users_params
    params.permit(projects_users: [:project_id,
                                   :email,
                                   :card_uid,
                                   :href,
                                   :is_hide,
                                   :set_account_id])
          .require(:projects_users)
  end

  def project_ids_params
    params.permit(project_ids: []).require(:project_ids)
  end

  def projects_params
    params.permit(projects: [:proj_name,
                             :proj_color,
                             :calendar_id,
                             :parent_id,
                             :due_date,
                             :flag,
                             :proj_type,
                             :info_card_order,
                             :current_mode,
                             :is_hide,
                             :state,
                             :recent_time,
                             :is_expand,
                             :order_storyboard,
                             :order_kanban,
                             :view_mode,
                             :ref,
                             :id,
                             :view_sort,
                             :kanban_mode,
                             alerts: [] ])
          .require(:projects)
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user.id,
                                 item_type: API_FOLDER.to_s)
  end

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

  def valid_json?(json)
    JSON.parse(json)
    true
  rescue
    false
  end
end
