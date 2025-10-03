class Api::Web::FilesController < Api::Web::BaseController
  require 'securerandom'
  EXCEPT_FIELDS = [:user_id, :id]

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
