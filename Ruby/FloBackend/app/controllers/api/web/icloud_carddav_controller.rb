require "./lib/icloud-reader.rb"
require "./lib/carddav.rb"
require 'uri'

class Api::Web::IcloudCarddavController < Api::Web::BaseController
  attr :vcard, :url, :user, :password, :authtype
  attr :icloud_carddav, :icl, :url, :server_number, :username, :ipw, :authtype, :icloud_user_id
  before_action :authenticate_with_icloud_carddav_server

  def authenticate_with_icloud_carddav_server
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    username = params[:username]
    account = SetAccount.find_by(user_id: user_id, user_caldav: username, account_type: ICLOUD_ACC_TYPE)
    if account
      begin
        # pass =  Api::Web::Utils.decrypt_rsa(rsa_pass)
        private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
        # password = private_key.private_decrypt(Base64.decode64(account.pass_income)).split('@')[0]
        pw = private_key.private_decrypt(Base64.decode64(account.pass_income))
        port = ''
        if account.port_caldav
          port = ':' + account.port_caldav.to_s
        end
        
        server_path_carddav = account.server_path_caldav.to_s.sub! 'calendars', 'carddavhome'
        
        carddav_url = "https://p01-contacts.icloud.com" + port.to_s + server_path_carddav.to_s
        
        #authenticate and create new client
        carddav = {
          :url      => carddav_url,
          :user     => account.user_caldav,
          :icloud_user_id => account.icloud_user_id,
          :password => pw[0, pw.rindex('@')],
          :authtype => 'basic'
        }
        @icloud_carddav = CardDav::ICloudClient.new(
            :uri => carddav[:url], 
            :user => carddav[:user] , 
            :password => carddav[:password],
            :icloud_user_id => carddav[:icloud_user_id], 
            :authtype => carddav[:authtype]
        )
      rescue
      end
    else
      render :json => {:error => ICLOUD_USER_INVALID, :description => MSG_USER_INVALID}
    end
  end
  
  def get_addressbooks
    address_books = [] 
    address_books = @icloud_carddav.propfind if @icloud_carddav.present?   
    respond_to do |format|
      format.json {render :json => address_books.to_json()}
    end
  end
  
  def get_contacts
    address_books = @icloud_carddav.propfind if @icloud_carddav.present?
    contacts = []
    if address_books
      address_books.each do |ad|
        vcards = @icloud_carddav.report(ad['href'])
        if vcards
          vcards.each do |card|
            contacts << card
          end
        end
      end
    end    
    respond_to do |format|
      format.json {render :json => contacts.to_json()}
    end
  end

  # Uri = address_book + uid + .vcf
  def get_contacts_by_uris
    uris = params[:uris]
    address_book = params[:address_book]
    contacts = []
    if address_book.present? && uris.present?
      vcards = @icloud_carddav.report_multiget(address_book, uris)
      if vcards
        vcards.each do |card|
          contacts << card
        end
      end
    end    
    respond_to do |format|
      format.json {render :json => {contacts: contacts}.to_json(:root => false)}
    end
  end
  
  def search_contact_by_emails
    search_email = params[:search].split(',')
    address_books = @icloud_carddav.propfind if @icloud_carddav.present?
    contacts = []
    if address_books
      if !search_email.nil?
        search_email.each do |email|
          if address_books
            address_books.each do |ad|
              vcards = @icloud_carddav.report(ad['href'], [email])
              if vcards
                vcards.each do |card|
                  contacts << {
                    'email' => email,
                    'card' => card
                  }
                end
              end
            end
          end   
        end
      end 
    end
    respond_to do |format|
      format.json {render :json => contacts.to_json()}
    end
  end
  
  def create_contact
    vcard_href = params[:vcard_href]
    vcard = params[:vcard]
    
    if vcard_href
      result = @icloud_carddav.create_contact(vcard_href, vcard)
    else
      address_books = @icloud_carddav.propfind
      if address_books
        result = @icloud_carddav.create_contact(address_books[address_books.length-1]['href'], vcard)
      end
    end
    
    
    res = {}
    res[:result] = 0
    if result
      res[:result]  = 1
    end
    render :json => res
  end
  
  def delete_contact
    vcard_href = params[:vcard_href]  
    result = @icloud_carddav.delete_contact(vcard_href)

    # TODO: Should remove before insert to DeletedItem
    uri = vcard_href.split('/').last.split('.').first
    unless uri.blank?
      links = Link.where("source_id = ? OR destination_id = ?", uri, uri)
      DeletedItem.save_deleted_item(@user_id, links)
      links.delete_all
    end

    res = {}
    res[:result] = 0
    if result
      res[:result]  = 1
    end
    render :json => res
  end
end
