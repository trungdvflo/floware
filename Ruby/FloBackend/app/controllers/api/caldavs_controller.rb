class Api::CaldavsController < Api::BaseController
  include Pundit

  def index
    @calendar_objects = []
    calendar_uids = []

    project_ids_params.each do |project_id|
      project = Project.find_by(id: project_id) || Project.new
      authorize project, :owner_or_member?
      calendar_uids << project.calendar_id
    end

    calendar_ids = Calendar.where(uri: calendar_uids).map(&:id)
    @calendar_objects = CalendarObject.where(calendarid: calendar_ids)
                                      .with_modifiedGTE(params[:modifiedGTE])
                                      .with_modifiedLT(params[:modifiedLT])
                                      .with_ids(params[:ids])
                                      .with_min_id(params[:minID])
                                      .with_p_item(params[:pItem])
  end

  def calendar_objects
    project = Project.find_by(id: params[:project_id]) || Project.new
    authorize project, :owner_or_member?

    obj_type = params[:obj_type] || API_VEVENT
    paginator = { cur_items: params[:cur_items], next_items: params[:next_items] }

    uris = []

    if params[:uris].present?
      uris = params[:uris].split(',').map do |uri|
        uri.strip << '.ics'
      end
    end

    calObjs = CalendarObject.shared_calendar_objects(project.owner.email, obj_type, uris, paginator)
    unless obj_type.eql?('VJOURNAL') || obj_type.eql?('VTODO')
      stodo_objs = CalendarObject.shared_calendar_objects(project.owner.email, 'VTODO', uris)
    end

    opts = date_range(params[:months])
    objs = ConvertCalendarObjectService.new.execute(calObjs, false, {}, opts)

    if stodo_objs
      opts[:stodo] = 1
      stodos = ConvertCalendarObjectService.new.execute(stodo_objs, false, {}, opts)
      if stodos
        objs[:data] += stodos[:data]
        objs[:num_of_errors] = objs[:num_of_errors] + stodos[:num_of_errors]
        objs[:total_num_of_items] = objs[:total_num_of_items] + stodos[:total_num_of_items]
      end
    end

    # insert TODO's id into objOrder table
    order_records = []
    data = objs[:data]
    if obj_type == 'VTODO'
      order_records = ObjOrder.where(user_id: project.owner.id,
                                     obj_type: obj_type,
                                     obj_id: data.map { |d| d[:uid].to_s })
    end

    if order_records.present?
      data.each do |item|
        next unless item[:itemType] == 'VTODO'
        order_records.each do |rc|
          if rc[:obj_id].to_s == item[:uid].to_s
            item[:order_number] = rc[:order_number]
            next
          end
        end
      end
    end

    respond_to do |format|
      format.json {render :json => objs.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end

  def create
    @calendar_objects = []
    @calendar_objects_errors = []

    shared_objects_params.each do |hash|
      project = Project.find_by(id: hash[:project_id]) || Project.new
      authorize project, :owner_or_member?

      i_calendar_object = parse_calendar_object(hash[:calendar_object])
      if i_calendar_object.blank?
        @calendar_objects_errors << { error: API_ITEM_CANNOT_SAVE,
                                      attributes: hash,
                                      description: MSG_ERR_NOT_SAVED  }
        next
      end
      calendar = Calendar.find_by(uri: project.calendar_id) || create_calendar(project, hash[:time_zone])

      calendar_object = CalendarObject.new(calendardata: hash[:calendar_object],
                                           calendarid: calendar.id,
                                           componenttype: i_calendar_object.ical_name,
                                           uid: i_calendar_object.uid.to_s)
      if calendar_object.save
        @calendar_objects << calendar_object
      else
        @calendar_objects_errors << { error: API_ITEM_CANNOT_SAVE,
                                      attributes: hash,
                                      description: calendar_object.errors.full_messages.join(',') }
        next
      end
      Calendarchange.create(uri: i_calendar_object.uid.to_s + '.ics',
                            synctoken: calendar.synctoken,
                            calendarid: calendar.id,
                            operation: Calendarchange::ADD_OPERATION)
      Link.create(source_id: calendar_object.uid,
                  source_type: calendar_object.componenttype,
                  user_id: project.owner.id,
                  destination_id: project.id,
                  destination_type: API_FOLDER)
    end
  end

  def update
    @calendar_objects = []
    @calendar_objects_errors = []

    shared_objects_params.each do |hash|
      project = Project.find_by(id: hash[:project_id]) || Project.new
      authorize project, :owner_or_member?

      i_calendar_object = parse_calendar_object(hash[:calendar_object])
      if i_calendar_object.blank?
        @calendar_objects_errors << { error: API_ITEM_CANNOT_SAVE,
                                      attributes: hash,
                                      description: MSG_ERR_NOT_SAVED }
        next
      end
      calendar = Calendar.find_by(uri: project.calendar_id)

      calendar_object = CalendarObject.find_by(uid: i_calendar_object.uid.to_s, calendarid: calendar&.id)
      if calendar_object.blank?
        @calendar_objects_errors << { error: API_ITEM_NOT_EXIST,
                                      attributes: hash,
                                      description: MSG_ERR_NOT_EXIST }
        next
      end
      if calendar_object&.update_attributes(calendardata: hash[:calendar_object])
        @calendar_objects << calendar_object
      else
        @calendar_objects_errors << { error: API_ITEM_CANNOT_SAVE,
                                      attributes: hash,
                                      description: calendar_object&.errors&.full_messages.join(',') || MSG_ERR_NOT_SAVED }
        next
      end
      Calendarchange.create(uri: i_calendar_object.uid.to_s + '.ics',
                            synctoken: calendar.synctoken,
                            calendarid: calendar.id,
                            operation: Calendarchange::MODIFY_OPERATION)
      calendar.increment(:synctoken).save
    end
  end

  def destroy
    @deleted_uids = []
    @delete_uids_errors = []

    shared_objects_params.each do |hash|
      project = Project.find_by(id: hash[:project_id]) || Project.new
      authorize project, :owner_or_member?

      calendar = Calendar.find_by(uri: project.calendar_id)
      calendar_object = CalendarObject.find_by(uid: hash[:uid], calendarid: calendar&.id)
      if calendar_object&.destroy
        @deleted_uids << calendar_object.uid
      else
        @delete_uids_errors << { error: API_ITEM_NOT_EXIST,
                                 attributes: hash,
                                 description: calendar_object&.errors&.full_messages.join(',') || MSG_ERR_NOT_EXIST }
        next
      end
      Calendarchange.create(uri: hash[:uid] + '.ics',
                            synctoken: calendar.synctoken,
                            calendarid: calendar.id,
                            operation: Calendarchange::DELETE_OPERATION)
      calendar.increment(:synctoken).save
    end
  end

  private

  def date_range(months)
    opts = {}
    return opts if months.blank?

    if months.length == 1
      month = months[0].to_s
      bom = Time.parse(month).utc.at_beginning_of_month
      eom = Time.parse(month).utc.at_end_of_month
    else
      bom = Time.parse(months[0].to_s).utc
      eom = Time.parse(months[months.length - 1].to_s).utc
    end
    opts[:prev] = bom.utc
    opts[:next] = eom.utc

    opts
  end

  def shared_objects_params
    params.permit(calendar_objects: [:calendar_object, :project_id, :uid, :time_zone])
          .require(:calendar_objects)
  end

  def create_calendar(project, time_zone)
    components = 'VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM'
    Calendar.create(principaluri: API_PRINCIPAL + project.owner.email,
                    displayname: project.proj_name,
                    uri: project.calendar_id,
                    synctoken: 1,
                    calendarorder: 0,
                    calendarcolor: project.proj_color,
                    timezone: time_zone,
                    components: components)
  end

  def project_ids_params
    params.permit(project_ids: []).require(:project_ids)
  end

  def parse_calendar_object(str_calendar_object)
    begin
      @_i_calendar = Icalendar::Parser.new(str_calendar_object).parse.first
      @_i_calendar.events.first || @_i_calendar.todos.first || @_i_calendar.journals.first
    rescue
      ''
    end
  end
end
