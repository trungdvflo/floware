class Api::Web::ImportcontactController < Api::Web::BaseController
  require 'net/http'
  require 'uri'

  EXCEPT_FIELDS = [:user_id]
  
  # get info 
  def index
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    respond_list = Array.new
    respond_list = ImportContact.where(user_id: user_id)
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
    end
  end
  
  # create 
  def create
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    respond_list = Array.new
    file_name = params[:file_name]
    file_size = params[:file_size]
    last_modify = params[:last_modify]
    imported_file = ImportContact.find_by(user_id: user_id,
                                          file_name: file_name,
                                          file_size: file_size,
                                          last_modify: last_modify)
    if !imported_file
      imported_file = ImportContact.new
      imported_file[:file_name] = file_name
      imported_file[:file_size] = file_size
      imported_file[:last_modify] = last_modify
      imported_file[:user_id] = user_id
      if imported_file.save
        respond_list << {:success => true, :data => imported_file}
      else
        respond_list << {:error => imported_file.errors, :description => MSG_ERR_INVALID}
      end
    end
    
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
    end
  end
end
