class Api::UrlbookmarkController < Api::BaseController
  require 'net/http'
  require 'uri'
  
  before_action :authenticate, :user_info, :except => [:index]
  EXCEPT_FIELDS = [:user_id]
  
  #get info 
  def index
    #params
    url = params[:url]
    res = {}
    title = ''
    if url
      begin
        content = Net::HTTP.get(URI.parse(url))
        title = url    
        title = content.match(/<title>(.*)<\/title>/)[1] if content
        res = {title: title.to_s}
      rescue
        arr = url.split('/')
        title = arr[2] if arr and arr.length >= 3  
        res = {title: title}
      end
    end
    #respond
    respond_list = Array.new()
    respond_list << res
    
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_URLS, :except => EXCEPT_FIELDS)}
    end
  end
end
