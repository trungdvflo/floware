class Api::SuggestedCollectionsController < Api::BaseController
  MAXIMUM_SUGGESTED_COLLECTION = 7

  def index
    @suggested_collections = current_user.suggested_collections
                                         .with_modifiedGTE(params[:modifiedGTE])
                                         .with_modifiedLT(params[:modifiedLT])
                                         .with_ids(params[:ids])
                                         .with_min_id(params[:minID])
                                         .with_p_item(params[:pItem])
                                         .with_fields(params[:fields])
  end

  def suggested
    suggested_collections = { TODO: todos,
                              NOTE: notes,
                              EMAIL: emails,
                              CONTACT: contacts,
                              EVENT: events,
                              FILE: files,
                              URL: urls }
    @suggested_collections = suggested_collections[params[:object_type]&.to_sym]
    @suggested_collections = @suggested_collections&.take(MAXIMUM_SUGGESTED_COLLECTION) || []
  end

  # rubocop:disable Metrics/BlockLength
  def create
    @suggested_collections = []
    @suggested_collections_errors = []
    suggested_collections_params.each do |hash|
      suggested_collection = SuggestedCollection.where(project_id: hash[:project_id],
                                                       criterion_type: hash[:criterion_type],
                                                       criterion_value: hash[:criterion_value],
                                                       user_id: current_user.id)
                                                .first_or_initialize
      if hash[:frequency_used].to_i > 0
        suggested_collection.frequency_used += hash[:frequency_used]
      elsif suggested_collection.persisted?
        suggested_collection.frequency_used += 1
      end

      if suggested_collection.save
        @suggested_collections << suggested_collection
      else
        @suggested_collections_errors << { error: API_ITEM_CANNOT_SAVE,
                                           attributes: suggested_collection,
                                           description: suggested_collection.errors.full_messages.join(',') }
      end

      if hash[:criterion_type] == Criterion::EMAIL_TYPE and hash[:emails].present?
        hash[:emails].each do |email|
          IdenticalSender.create(user_id: current_user.id,
                                 suggested_collection: suggested_collection,
                                 email_address: email)
        end
      end
      if hash[:criterion_type] == Criterion::CONTACT_DOMAIN and hash[:email_domains].present?
        hash[:email_domains].each do |email|
          IdenticalSender.create(user_id: current_user.id,
                                 suggested_collection: suggested_collection,
                                 email_address: email)
        end
      end
      if hash[:criterion_type] == Criterion::EVENT_INVITEE and hash[:invitees].present?
        hash[:invitees].each do |invitee|
          IdenticalSender.create(user_id: current_user.id,
                                 suggested_collection: suggested_collection,
                                 email_address: invitee)
        end
      end
    end
  end
  # rubocop:enable Metrics/BlockLength

  def destroy
    super
  end

  private

  def todos
    suggested_collections = []
    # all_suggested_collections = current_user.suggested_collections.by_todo.uniq{|s| s.project_id}.map(&:id)
    # 2 most recent with toto title
    suggested_collections +=  current_user.suggested_collections
                                          .by_todo_title(params[:title])
                                          .where.not(project_id: suggested_collections.map(&:project_id))
                                          .where.not(project_id: trashed_project_ids)
                                          .where.not(project_id: hided_project_ids)
                                          .uniq(&:project_id).first(2)
    # 3 most recent collections used


    suggested_collections += suggested_by_most_recent(suggested_collections).by_todo.uniq(&:project_id).first(3)

    # 3 most frequency collections used
    suggested_collections += suggested_by_most_frequency(suggested_collections).by_todo.uniq(&:project_id).first(3)
    suggested_collections
  end
# 2 Most recent move/add with identical title
# 3 Most recent move add
# 3 Most frequent move/ad

  def notes
    suggested_collections = []

    # 2 most recent with note title
    suggested_collections += current_user.suggested_collections
                                         .by_note_title(params[:title])
                                         .where.not(project_id: suggested_collections.map(&:project_id))
                                         .where.not(project_id: trashed_project_ids)
                                         .where.not(project_id: hided_project_ids)
                                         .uniq(&:project_id).first(2)
    # 3 most recent collections used
    suggested_collections += suggested_by_most_recent(suggested_collections)
                             .by_note
                             .uniq(&:project_id).first(3)

    # 3 most frequency collections used
    suggested_collections += suggested_by_most_frequency(suggested_collections)
                             .by_note
                             .uniq(&:project_id).first(3)
    suggested_collections
  end

  def emails
    suggested_collections = []
    # 3 most recent collections used to file email with subject and sender
    suggested_collections += suggested_by_subject_and_email.uniq(&:project_id).first(3)

    # 3 most recent collections used to file emails with subject
    suggested_collections += suggested_by_subject
                             .where
                             .not(project_id: suggested_collections.map(&:project_id))
                             .uniq(&:project_id).first(3)

    # 4 most recent collections used to file emails with identical sender
    suggested_collections += suggested_by_email
                             .where
                             .not(project_id: suggested_collections.map(&:project_id))
                             .uniq(&:project_id).first(4)

    # 4 most recent collections used to file emails
    suggested_collections += suggested_by_most_recent(suggested_collections)
                             .by_email.uniq(&:project_id).first(4)


    # 4 most frequency used collections used to file emails
    suggested_collections += suggested_by_most_frequency(suggested_collections)
                             .by_email.uniq(&:project_id).first(4)


    suggested_collections
  end

  def suggested_by_subject
    return SuggestedCollection.none if params[:subject].blank?
    @_suggested_by_subject ||= current_user.suggested_collections
                                           .by_email_subject(params[:subject])
                                           .where.not(project_id: trashed_project_ids)
                                           .where.not(project_id: hided_project_ids)
  end

  def suggested_by_email
    return SuggestedCollection.none if params[:emails].blank?
    suggested_collection_ids = IdenticalSender.where(email_address: params[:emails])
                                              .pluck('DISTINCT suggested_collection_id')
    @_suggested_by_email = current_user.suggested_collections
                                       .by_email
                                       .where(id: suggested_collection_ids)
                                       .where.not(project_id: trashed_project_ids)
                                       .where.not(project_id: hided_project_ids)
  end

  def suggested_by_subject_and_email
    return SuggestedCollection.none if suggested_by_subject.blank?
    suggested_by_subject.where(id: suggested_by_email.map(&:id))
                        .where.not(project_id: trashed_project_ids)
                        .where.not(project_id: hided_project_ids)
  end

  def contacts
    suggested_collections = []

    # 2 most recent with same company name
    suggested_collections += current_user.suggested_collections
                                         .by_contact_company(params[:company_name])
                                         .where.not(project_id: trashed_project_ids)
                                         .where.not(project_id: hided_project_ids)
                                         .uniq(&:project_id)
                                         .first(2)
    # pp suggested_collections, "suggested_collections", all_suggested_collections, params[:company_name]
    # # 2 most recent with same domain

    # suggested_collections += current_user.suggested_collections
    #                                      .by_contact_domain(params[:email_domains][0])
    #                                      .where.not(project_id: suggested_collections.map(&:project_id))
    #                                      .where.not(project_id: trashed_project_ids)
    #                                      .where.not(project_id: hided_project_ids)
    #                                      .limit(2)
    suggested_collection_ids = IdenticalSender.where(email_address: params[:email_domains])
                                              .pluck('DISTINCT suggested_collection_id')
    suggested_collections += current_user.suggested_collections
                                         .by_contact
                                         .where(id: suggested_collection_ids)
                                         .where.not(project_id: trashed_project_ids)
                                         .where.not(project_id: hided_project_ids)
                                         .where.not(id: suggested_collections.map(&:id))
                                         .uniq(&:project_id)
                                         .first(2)
    # 3 most recent used
    suggested_collections += suggested_by_most_recent(suggested_collections)
                             .by_contact
                             .uniq(&:project_id)
                             .first(3)
    # 3 most frequency used
    suggested_collections += suggested_by_most_frequency(suggested_collections)
                             .by_contact
                             .uniq(&:project_id).first(3)
    suggested_collections
  end

  def events
    suggested_collections = []
    # all_suggested_collections = current_user.suggested_collections.by_event.uniq{|s| s.project_id}.map(&:id)
    # 2 most recent with same title
    suggested_collections += suggested_by_event_title.where
                                                     .not(project_id: suggested_collections.map(&:project_id))
                                                     .uniq(&:project_id)
                                                     .first(2)
    # 2 most recent with same invitees
    suggested_collections += suggested_by_event_invitees.where
                                                        .not(project_id: suggested_collections.map(&:project_id))
                                                        .uniq(&:project_id)
                                                        .first(2)
    # 2 most recent with same location
    suggested_collections += suggested_by_event_location.where.not(project_id: suggested_collections.map(&:project_id))
                                                        .uniq(&:project_id)
                                                        .first(2)
    # 3 most recent used
    suggested_collections += suggested_by_most_recent(suggested_collections).uniq(&:project_id).first(3)
    # 3 most frequency used
    suggested_collections += suggested_by_most_frequency(suggested_collections).uniq(&:project_id).first(3)
    suggested_collections
  end

  def suggested_by_event_title
    return SuggestedCollection.none if params[:title].blank?
    current_user.suggested_collections
                .includes(:project)
                .by_criterion(Criterion::EVENT_TITLE, params[:title])
                .where.not(project_id: trashed_project_ids)
                .where.not(project_id: hided_project_ids)
  end

  def suggested_by_event_invitees
    return SuggestedCollection.none if params[:invitees].blank?
    suggested_collection_ids = IdenticalSender.where(email_address: params[:invitees])
                                              .pluck('DISTINCT suggested_collection_id')
    @_suggested_by_email = current_user.suggested_collections
                                       .by_event
                                       .where(id: suggested_collection_ids)
                                       .where.not(project_id: trashed_project_ids)
                                       .where.not(project_id: hided_project_ids)
  end

  def suggested_by_event_location
    return SuggestedCollection.none if params[:location].blank?
    current_user.suggested_collections
                .includes(:project)
                .by_criterion(Criterion::EVENT_LOCATION, params[:location])
                .where.not(project_id: trashed_project_ids)
                .where.not(project_id: hided_project_ids)
  end

  def files
    suggested_collections = []

    # 4 most recent used
    suggested_collections += suggested_by_most_recent(suggested_collections).by_file.group(:project_id).limit(4)
    # 3 most frequency used
    suggested_collections += suggested_by_most_frequency(suggested_collections).by_file.group(:project_id).limit(3)
    suggested_collections
  end

  def urls
    suggested_collections = []
    # 4 most recent used
    suggested_collections += suggested_by_most_recent(suggested_collections).by_url.uniq(&:project_id).first(4)
    # 3 most frequency used
    suggested_collections += suggested_by_most_frequency(suggested_collections).uniq(&:project_id).first(3)
    suggested_collections
  end

  def suggested_by_most_recent(existed_collections)
    current_user.suggested_collections
                .includes(:project)
                .where.not(project_id: existed_collections.map(&:project_id))
                .where.not(project_id: trashed_project_ids)
                .where.not(project_id: hided_project_ids)
  end

  def suggested_by_most_frequency(existed_collections)
    current_user.frequency_used_suggested_collections
                .includes(:project)
                .where.not(project_id: existed_collections.map(&:project_id))
                .where.not(project_id: trashed_project_ids)
                .where.not(project_id: hided_project_ids)
  end

  def trashed_project_ids
    @_trashed_project_ids ||= Trash.where(user_id: current_user.id, obj_type: API_FOLDER).map(&:obj_id)
  end

  def hided_project_ids
    @_hided_project_ids ||= current_user.projects.available.map(&:id)
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user_id.user_id,
                                 item_type: API_SUGGESTED_COLLECTION.to_s,
                                 is_recovery: hash_param[:is_recovery])
  end

  def delete(ids)
    deleted_ids = []
    suggested_by_ids = SuggestedCollection.find_by_ids(current_user.id, permit_id_params(ids))
    deleted_ids = suggested_by_ids.map(&:id)
    suggested_by_ids.destroy_all

    deleted_item_service(ids: deleted_ids).execute
    deleted_ids
  end

  def suggested_collections_params
    params.permit(:modifiedLT, :modifiedGTE, :ids, :pItem, :fields, :object_type,
                  :company_name, :subject, email_domains: [], emails: [], invitees: [], 
                  suggested_collections: [:project_id,
                                          :criterion_type,
                                          :criterion_value,
                                          :frequency_used,
                                          emails: [], email_domains: [], invitees: []])
          .require(:suggested_collections)
  end
end
