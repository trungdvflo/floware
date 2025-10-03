require "./lib/app_utils.rb"
class Api::Web::EmailFilingsController < Api::Web::BaseController
  # include AppUtils

  # require 'digest/md5'
  # require 'digest'
  # require 'base64'

  # EXCEPT_FIELDS = [:user_id]

  # # rubocop:disable Metrics/MethodLength
  # def suggest_collections
    # # email_filing = EmailFiling.where(account_id: params["accountId"], user_id: @user_id).order("priority DESC").first(5)
    # email_filing = []

    # # only select id after that map
    # # (
    # #   don't get all data from DB after get ids is slow
    # #   Project.where(user_id: @user_id).map(&:id)
    # # )
    # project_trash = Trash.where(user_id: @user_id, obj_type: API_FOLDER).select(:obj_id).map(&:obj_id)
    # # Suggested Collection
    # # Last Collections used to file email with identical title.
            # collection_ids = []
    # email_filing_subject_ar = EmailFiling.where(account_id: params["accountId"],
                                                # user_id: @user_id,
                                                # email_subject: params["email_subject"])
                                         # .order("priority DESC")
    # email_filing_subject_ar = email_filing_subject_ar.where("project_id NOT IN (?)", project_trash) unless project_trash.blank?
    # email_filing_subject = email_filing_subject_ar.first
    # # Last 4 Collections used to file email with identical sender.
    # email_addresses = [*params["email_addresses"]].join("','")
    # if email_addresses.present?
      # filing_identicals = IdenticalSender.where("user_id = ? and email_address IN (?)", @user_id, email_addresses).collect(&:filing_id)
      # if filing_identicals.present?
        # if email_filing_subject.present?
          # email_filing.push email_filing_subject
          # filing_identicals.delete(email_filing_subject.id)
        # end
        # email_filing_four = EmailFiling.where(user_id: @user_id, id: filing_identicals)
                                # .order("priority DESC")
        # email_filing_four = email_filing_four.where("project_id NOT IN (?)", project_trash) unless project_trash.blank?
        # email_filing_four = email_filing_four.limit(4)
        # email_filing.concat(email_filing_four) if email_filing_four.present?
        # collection_ids = email_filing_four.collect(&:id) if email_filing_four.present?
      # end
    # end
    # collection_ids << email_filing_subject.id if email_filing_subject.present?
    # # Last 5 Collections used to file emails.

    # if collection_ids.present?
      # email_filing_last_five = EmailFiling.where("user_id = ? and id NOT IN (?)", @user_id, collection_ids)
                                   # .order("priority DESC")
    # else 
      # email_filing_last_five = EmailFiling.where("user_id = ?", @user_id).order("priority DESC")
    # end
    # email_filing_last_five = email_filing_last_five.where("project_id NOT IN (?)", project_trash) unless project_trash.blank?
    # email_filing_last_five = email_filing_last_five.limit(5)
    # if email_filing_last_five.present?
      # collection_ids = collection_ids.concat(email_filing_last_five.collect(&:id))
    # end

    # email_filing = email_filing.concat(email_filing_last_five) if email_filing_last_five.present?

    # if collection_ids.present?
      # email_filing_last_5_commonly = EmailFiling.where("user_id = ? and id NOT IN (?)", @user_id, collection_ids)
                                         # .order("frequency_used DESC, priority DESC")
    # else 
      # email_filing_last_5_commonly = EmailFiling.where("user_id = ?", @user_id)
                                         # .order("frequency_used DESC, priority DESC")
    # end
    # email_filing_last_5_commonly = email_filing_last_5_commonly.where("project_id NOT IN (?)", project_trash) unless project_trash.blank?
    # email_filing_last_5_commonly = email_filing_last_5_commonly.limit(5)
    # email_filing = email_filing.concat(email_filing_last_5_commonly) if email_filing_last_5_commonly.present?
    # email_filing = {"email_filings" => email_filing.map(&:project_id).uniq}
    
    # respond_to do |format|
      # format.xml {render :xml => email_filing.to_xml(:except => EXCEPT_FIELDS, :methods => :ref)}
      # format.json {render :json => email_filing.to_json(:except => EXCEPT_FIELDS, :methods => :ref)}
    # end
  # end
  # # rubocop:enable Metrics/MethodLength

  # def filing_to_collection
    # lnk = params[API_LINKS] || params[API_PARAMS_JSON]
    # count = 0
    # respond_list = Array.new
    # if lnk.present?
        # lnk[:source_account] = '' if !lnk[:source_account]
        # lnk[:destination_account] = '' if !lnk[:destination_account]
        # lnk[:source_root_uid] = '' if !lnk[:source_root_uid]
        # lnk[:destination_root_uid] = '' if !lnk[:destination_root_uid]
        # lnk[:identical_senders] = '' if !lnk[:identical_senders]
        # lk = Link.new(lnk.except(:email_subject, :identical_senders).permit!)
        # lk.user_id = @user_id
        # lk.email = @email.downcase.strip

        # if lk.save
          # filing_collection = EmailFiling.where(project_id: lk.destination_id, account_id: lk.source_account, user_id: @user_id).first
          # if filing_collection.blank?
            # filing_collection = EmailFiling.new(project_id: lk.destination_id, account_id: lk.source_account, user_id: @user_id)
          # end
          # max_filing_collection = EmailFiling.where(user_id: @user_id).order("priority DESC").first
          # if max_filing_collection.present?
            # filing_collection.priority = max_filing_collection.priority + 1
          # else
            # filing_collection.priority = 1;
          # end
          # filing_collection.frequency_used = filing_collection.frequency_used + 1;
          # filing_collection.email_subject = lnk[:email_subject]
          # if filing_collection.save
            # respond_list = filing_collection
            # lnk[:identical_senders].each do |identical_sender|
                # IdenticalSender.create(user_id: @user_id, filing_id: filing_collection.id, email_address: identical_sender); 
            # end 
          # end
        # else
          # respond_list = {:error => lk.errors, :description => MSG_ERR_INVALID}
        # end
    # end
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS, :methods => :ref)}
    # end
  # end

  # def filing_to_multiple_collections
    # links = params[API_LINKS] || params[API_PARAMS_JSON];
    # respond_list = []
    # links.each do |lnk|
      # lnk[:identical_senders] ||= []
      # filing_collection = EmailFiling.where(project_id: lnk[:destination_id], account_id: lnk[:source_account], user_id: @user_id).first
      # if filing_collection.blank?
        # filing_collection = EmailFiling.new(project_id: lnk[:destination_id], account_id: lnk[:source_account], user_id: @user_id)
      # end
      # max_filing_collection = EmailFiling.where(user_id: @user_id).order("priority DESC").first
      # if max_filing_collection.present?
        # filing_collection.priority = max_filing_collection.priority + 1
      # else
        # filing_collection.priority = 1;
      # end
      # filing_collection.frequency_used = filing_collection.frequency_used + 1;
      # filing_collection.email_subject = lnk[:email_subject]
      # if filing_collection.save
        # lnk[:identical_senders].each do |identical_sender|
            # IdenticalSender.create(user_id: @user_id, filing_id: filing_collection.id, email_address: identical_sender); 
        # end 
      # end
      # respond_list << filing_collection
    # end
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS, :methods => :ref)}
    # end  
  # end

  # def move_to_collection
    # lnk = params[API_LINKS] || params[API_PARAMS_JSON]
    # count = 0
    # respond_list = Array.new
    # if lnk.present?
      # filing_collection = EmailFiling.where(project_id: lnk[:destination_id], account_id: lnk[:source_account], user_id: @user_id).first
      # if filing_collection.blank?
        # filing_collection = EmailFiling.new(project_id: lnk[:destination_id], account_id: lnk[:source_account], user_id: @user_id)
      # end
      # max_filing_collection = EmailFiling.where(user_id: @user_id).order("priority DESC").first
      # if max_filing_collection.present?
        # filing_collection.priority = max_filing_collection.priority + 1
      # else
        # filing_collection.priority = 1;
      # end
      # filing_collection.frequency_used = filing_collection.frequency_used + 1;
      # filing_collection.email_subject = lnk[:email_subject]
      # if filing_collection.save && lnk[:identical_senders].present?
        # lnk[:identical_senders].each do |identical_sender|
            # IdenticalSender.create(user_id: @user_id, filing_id: filing_collection.id, email_address: identical_sender); 
        # end 
      # end
      # respond_list << filing_collection
    # end
    # respond_to do |format|
      # format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS, :methods => :ref)}
    # end
  # end
end
