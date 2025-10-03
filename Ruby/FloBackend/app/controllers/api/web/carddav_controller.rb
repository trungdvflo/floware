require "./lib/carddav.rb"
require 'uri'
require "mini_magick"

class Api::Web::CarddavController < Api::Web::BaseController
  attr_reader :vcard, :url, :user, :password, :authtype
  before_action :authenticate_with_sabre_carddav_server, :except => [:get_contacts_by_sql, 
                                                                    :get_contacts_group_by_sql,
                                                                    :get_avatar_by_uids,
                                                                    :fulltext_search_contact,
                                                                    :search_contact_by_sql,
                                                                    :get_avatar_img_by_uid]
  
  def authenticate_with_sabre_carddav_server
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    email = current_user_id.email if current_user_id
    user = User.find_by(email: email)
    password = ''
    if user
      begin
        # pass =  Api::Web::Utils.decrypt_rsa(rsa_pass)
        private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
        password = private_key.private_decrypt(Base64.decode64(user.rsa))

        #authenticate and create new client
        caldav = {
          :url      => FLOL_CARDDAV_SERVER_URL,
          :user     => CGI.escape(email),
          :password      => password,
          :authtype => 'digest'
        }
        @vcard = CardDav::Client.new(:uri => caldav[:url], :user => caldav[:user] , :password => caldav[:password], :authtype => caldav[:authtype])
      rescue
      end
    else
      render :json => {:error => CARDDAV_USER_INVALID, :description => MSG_USER_INVALID}
    end
  end
  
  def get_addressbooks
    address_books = @vcard.propfind

    res = {}
    if address_books.present?
      res[:data] = address_books
    end

    respond_to do |format|
      format.json {render :json => res.to_json()}
      format.xml {render :xml => res.to_xml()}
    end #end respond
  end
  
  def get_contacts
    address_books = @vcard.propfind
    contacts = []
    address_books&.each do |ad|
      vcards = @vcard.report(ad['href'])
      vcards&.each do |card|
        contacts << card
      end
    end
    respond_to do |format|
      format.json {render :json => contacts.to_json()}
    end
  end
  
  # rubocop:disable Metrics/MethodLength, Metrics/BlockLength
  def get_contacts_by_sql
    num_of_trashed_items = 0
    num_of_errors = 0
    email = current_user_id.email if current_user_id
    objs = Array.new
    uris = params[:uris]
    collection_id = params[:collection_id]
    include_avatar = params[:include_avatar]

    if uris.present?
      uris = uris.split(',').map { |uri| uri.strip + ".vcf" }
    end

    begin_chars = params[:begin_chars] ? params[:begin_chars].split(',') : []
    display_config = params[:display_config]
    except_uids = params[:except_uid] ? params[:except_uid] : ''


    cur_items = params[:cur_items]
    next_items = params[:next_items]

    if collection_id.present?
      cards = Cards.get_cards_by_collection_id(email, uris, cur_items, next_items, except_uids, collection_id)
    else
      cards = Cards.get_cards(email, uris, cur_items, next_items, except_uids)
    end


    # Convert active record resuls to hash for checking the existent item in trash
    # {'object-uri-abcd-xyz' => 1}
    trashed_contact = Trash.select('obj_id').where(user_id: current_user_id.user_id, obj_type: 'VCARD').each_with_object({}) do |el, hash|
        hash_key = el[:obj_id].to_s
        hash[hash_key] = 1
    end

    num_of_contact_group = 0
    contacts = Array.new
    if cards
      root = "/addressbookserver.php/addressbooks/#{email}/"
      cards.each do |card|
        if !params[:include_trash].present?
          existed = Api::Web::Utils.filter_by_trash(trashed_contact, card.uri.split('.')[0])
          if existed
            num_of_trashed_items += 1
          end
          next if existed
        end

        begin
          has_photo = 0
          vcards = Vpim::Vcard.decode(card.carddata)
          next if vcards.nil?
          vcards.each do |contact|
            valid = false

            if begin_chars.length == 0 || cards.length < 50
              valid = true
            else
              valid = belongTo(contact, begin_chars, display_config)
            end

            ct = contact.fields.detect { |f|
              f.name.eql?("X-ADDRESSBOOKSERVER-KIND")
            }

            if ct
              num_of_contact_group += 1
            end

            next if !valid || ct


            #remove the photo
            if include_avatar.blank?
              ct_fields = contact.fields.reject{ |f|
                f.name.eql?("PHOTO")
              }
            else
              ct_fields = contact.fields
            end
            contact_str = ct_fields.join("\r\n")


            vc = {
              'href' => root + card.calendar_uri.to_s + "/" + card.uri.to_s,
              'data' => contact_str,
              'has_photo' => contact.field("PHOTO") ? 1 : 0
            }

            contacts << vc
          end
        rescue
          num_of_errors += 1
        end
      end
    end

    rs = {
      :data => contacts,
      :num_of_trashed_items => num_of_trashed_items,
      :num_of_errors => num_of_errors,
      :total => cards.length,
      :num_of_contact_group => num_of_contact_group
    }

    respond_to do |format|
      format.json {render :json => rs.to_json()}
    end
  end
  # rubocop:enable Metrics/MethodLength, Metrics/BlockLength

  # rubocop:disable Metrics/BlockLength
  def belongTo(contact, groups, display_config = nil)
    valid = false
    contact.fields.each do |f|
      if f.name.eql?("N")
        # Family; Given; Middle; Prefix; Suffix
        name_parts = f.value.split(';')
        last_name = ''
        first_name = ''
        middle_name = ''
        full_name = ''
        if !name_parts.nil? && name_parts.length
          last_name = name_parts[0]
          first_name = name_parts[1]
          middle_name = name_parts[2]
        end

        config = 1
        if !display_config.nil?
          config = display_config
        end

        #display config:
        # 0: Last, First
        # 1: First Last
        # 2: Last Middle First
        case config
        when 0
          full_name = last_name + ", " + first_name
        when 1
          full_name = first_name + " " + last_name
        when 2
          full_name = last_name + " " + middle_name + " " + first_name
        else
          full_name = first_name + " " + last_name
        end
        full_name = full_name.strip

        firt_letter_of_fn = full_name && full_name.length ? full_name[0].upcase: ''
        groups.each do |char|
          if char.upcase.eql?(firt_letter_of_fn)
            valid = true
          end
        end
      end
    end
    return valid
  end
  # rubocop:enable Metrics/BlockLength

  def get_contact_groups
    address_books = params[:address_books]
    contact_groups = Array.new
    if address_books.present?
      address_books.each do |ad|
        vcards = @vcard.report_contact_group(ad)
        if vcards.present?
          vcards.each do |card|
            contact_groups << {
              href: card[:href],
              data: card[:data]
            }
          end
        end
      end
    end

    rs = {
      :data => contact_groups,
      :num_of_errors => 0
    }

    respond_to do |format|
      format.json {render :json => rs.to_json()}
    end
  end

  def get_contacts_group_by_sql
    # num_of_trashed_items = 0
    num_of_errors = 0
    email = current_user_id.email if current_user_id
    objs = Array.new

    cards = Cards.get_cards(email, nil, nil)
    
    # trashed_contact = Trash.find(:all, :conditions=>["user_id = ? and obj_type = 'VCARD'", current_user_id.user_id])
    
    contacts = Array.new
    if cards
      root = "/addressbookserver.php/addressbooks/#{email}/"
      cards.each do |card|
        # APPLE_AB_KIND_KEY: 'X-ADDRESSBOOKSERVER-KIND',
        # APPLE_AB_MEMBER_KEY: 'X-ADDRESSBOOKSERVER-MEMBER',


        # if !params[:include_trash]
          # existed = Api::Web::Utils.filter_by_trash(trashed_contact, card.uri.split('.')[0])
          # if existed
            # num_of_trashed_items += 1
          # end
          # next if existed
        # end
        
        begin
          vcards = Vpim::Vcard.decode(card.carddata)
          vcards.each do |contact|
            ct = contact.fields.detect { |f|
              f.name.eql?("X-ADDRESSBOOKSERVER-KIND")
            }
            
            if ct
              contact_str = contact.fields.join("\r\n")
              vc = {
                'href' => root + card.calendar_uri.to_s + "/" + card.uri.to_s,
                'data' => contact_str
              }
              contacts << vc
            end
          end
        rescue
          num_of_errors += 1
        end
      end
    end
    
    rs = {
      :data => contacts,
      # :num_of_trashed_items => num_of_trashed_items,
      :num_of_errors => num_of_errors
    }
    
    respond_to do |format|
      format.json {render :json => rs.to_json()}
    end
  end
  
  def get_avatar_by_uids
    num_of_errors = 0
    email = current_user_id.email if current_user_id
    objs = Array.new
    uids = params[:uids]
    uris = params[:uris] || uids

    if uids.present?
      uids = uids.map do |uid|
        uid.strip << '.vcf'
      end
      uris.concat uids if uris.present?
    end

    cards = Cards.get_cards(email, uris)

    contacts = Array.new
    if cards
      root = "/addressbookserver.php/addressbooks/#{email}/"
      cards.each do |card|
        begin
          vcards = Vpim::Vcard.decode(card.carddata)
          vcards.each do |contact|
            #remove the photo
            ct_fields = contact.fields.detect{ |f|
              f.name.eql?("PHOTO")
            }

            vc = {
              'href' => root + card.calendar_uri.to_s + "/" + card.uri.to_s,
              'uid' => card.uri.to_s,
              'avatar' => ct_fields
            }
            contacts << vc
          end
        rescue
          num_of_errors += 1
        end
      end
    end
    
    rs = {
      :data => contacts,
      :num_of_errors => num_of_errors
    }
    
    respond_to do |format|
      format.json {render :json => rs.to_json()}
    end
  end
  
  # TODO: request time is very long (30s) when around 5 requests are sent simultaneously
  # ffield = {'email', 'fn', ...}
  # fmatch = {'contains', 'equals', 'starts-with', 'ends-with'}
  # fvalue = the string value that ffield contains

  # rubocop:disable Style/InverseMethods
  def search_contact
    address_books = @vcard.propfind
    contacts = []
    values = params[:fvalue].split(',').map{ |s| s.strip }
    # root = "/addressbookserver.php/addressbooks/#{@email}/"
    
    if address_books
      trash = Trash
        .where({ user_id: @user_id })
        .select { |t| t.obj_type == 'VCARD' }
        .map { |t| t.obj_id }

      address_books.each do
        begin
          values.each do |v|
            # vcards = @vcard.report(ad['href'], params[:ffield], v, params[:fmatch])
            results = Cards.seach_contact_by_qs(v, @email) # search by sql instead of sabredav

            results = results.select do |contact|
              !trash.any? { |trash_id| contact[:uri].include? trash_id.to_s }
            end

            contacts.concat(results)
          end
        rescue
        end
      end
    end

    respond_to do |format|
      format.json {render :json => contacts.to_json}
    end
  end
  # rubocop:enable Style/InverseMethods

  def fulltext_search_contact
    query = params[:qs]
    data = []
    if query.present?
      rs = Cards.fulltext_seach_contact_by_qs(query, @email)
      if !rs.nil?
        data.concat(rs)
      end
    end
    data = {"items" => data, "search_term" => query}
    respond_to do |format|
      format.json {render :json => data.to_json()}
    end
  end

  def create_contact
    vcard_href = params[:vcard_href]
    vcard = params[:vcard]
    result = @vcard.create_contact(vcard_href, vcard)
    res = {}
    res[:result] = 0
    if result
      res[:result]  = 1
    end
    render :json => res
  end

  def delete_contact
    result = @vcard.delete_contact(params[:href])
    res = {}
    res[:result] = 0
    if result
      res[:result] = 1
      if params[:uid].present?
        save_delete_item(API_CONTACT_TYPE, params[:uid])
      end
    end
    render :json => res
  end
  
  def delete_contacts
    puts 'access function'
    respond_list = []
    contacts = params[:contacts]
    if contacts.present?
      contacts.each do |ct|
        result = @vcard.delete_contact(ct[:href])
        res = {}
        res[:result] = 0
        if result
          res[:result]  = 1
          if ct[:uid].present?
            Cards.del_links(@user_id, ct[:uid])
            save_delete_item(API_CONTACT_TYPE, ct[:uid])
          end
        end
        respond_list << res
      end
    end
    
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => "CONTACTS" )}
    end
  end

  def search_contact_by_sql
    query = params[:qs]
    data = []
    if query.present?
      rs = __search_contact(query)
      trash = Trash
                  .where({ user_id: @user_id })
                  .select { |t| t.obj_type == 'VCARD' }
                  .map { |t| "#{t.obj_id}.vcf" }
      rs.reject! { |item| trash.include? item[:uri] }
      if !rs.nil?
        data.concat(rs)
      end
    end

    data = {"items" => data, "search_term" => query}
    respond_to do |format|
      format.json {render :json => data.to_json()}
    end
  end

  def __search_contact(qs)
    # Cards.seach_contact_by_qs(qs, @email)
    Cards.seach_contact_by_email(qs, @email)
  end

  def get_first_contacts_by_email_addrs
    email_addrs = params[:emails]
    principle_email = current_user_id.email if current_user_id
    respond_list = []
    email_addrs = email_addrs || []
    email_addrs.each do |email_addr|
      next unless valid_email? email_addr
      data = Cards.get_first_contact_by_email_addr(principle_email, email_addr).first
      next if data.blank?
      data[:email] = email_addr
      respond_list << data
    end
    
    respond_to do |format|
      format.json {render :json => {contacts: respond_list}.to_json(:root => false)}
    end
  end

  def get_avatar_img_by_uid
    width = params[:w].blank? ? "128" : params[:w]
    height = params[:h].blank? ? "128" : params[:h]
    if !number?(width) || !number?(height)
      return send_data(nil, :type => "image/jpeg", :disposition => "inline", status: :bad_request)
    end
    email = current_user_id.email if current_user_id
    uid = params[:uid]
    photo = nil

    if uid.present?
      uid << '.vcf'
    end
    card = Cards.get_cards(email, uid, 0, 1).first
    raise ImageNotFound if card.blank?
    vcards = Vpim::Vcard.decode(card.carddata)
    vcards.each do |contact|
      photo = contact.field("PHOTO")&.value
    end
    raise ImageNotFound if photo.blank?
    photo_match = photo.match(/http{1}s?\:\/\/.+\.(png|jpg|jpeg|gif)$/)
    if photo_match
      begin
      image = MiniMagick::Image.open(photo_match[0])
      rescue Exception => ex
        return send_data(nil, :type => "image/jpeg", :disposition => "inline", status: :bad_request)
      end
    else # is base64
      image = MiniMagick::Image.read(photo)
    end

    send_file(image.resize("#{width}x#{height}").path, :type => image.mime_type, :disposition => "inline")
  end

  def valid_email?(email)
    email =~ /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i
  end

  private
  def number? v
    return true if v.is_a? Numeric
    (v =~ /\A[-+]?[0-9]*\.?[0-9]+\Z/) == 0 ? true : false
  end
end
