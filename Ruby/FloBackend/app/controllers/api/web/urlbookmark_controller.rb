require 'metainspector'

class Api::Web::UrlbookmarkController < Api::Web::BaseController
  require 'net/http'
  require 'uri'
  require 'open-uri'
  require 'httparty'
  require 'nokogiri'
  require 'json'
  # require 'pry'
  require 'metainspector' #refer to: https://github.com/jaimeiniesta/metainspector

  before_action :authenticate, :user_info, :except => [:index]
  EXCEPT_FIELDS = [:user_id]

  def index
    data, data_err, err_code = [], [], nil
    url = params[:url]
    # onlyPage = params[:page]
    pageCnt = {:title => "Sorry, we can not load your page!", :status => 1}
    begin
      url = url.strip
      if url.index('http') != 0
        url = 'http://' + url
      end

      page = MetaInspector.new(url, :connection_timeout => 10, :read_timeout => 16, :retries => 1)
      page_noko = HTTParty.get(url)

      content_type = page_noko.headers['content-type']
      unless content_type.include? 'text/html' or content_type.include? 'text/plain'
        pageCnt = {:title => "", :status => 0, :description => "", :meta => page.meta, :images => []}
      else
        html = Nokogiri::HTML(page_noko)
        title_noko = html.css('title').children.text

        title = page.title != '' ? page.title : title_noko

        images = []

        if page.meta['og:image'].present?
          images << page.meta['og:image']
        else
          images = page.images
        end

        pageCnt = {:status => 0, :title => title, :description => page.description,
                   :meta => page.meta, :images => images}
      end
    rescue Faraday::TimeoutError => exception
      pageCnt = {title: "", status: 0, description: exception.message, meta: "", images: []}
    rescue Exception => exception
      pageCnt = {title: "", status: 0, description: exception.message, meta: "", images: []}
    end if url.present?
    dataRe = {url: pageCnt}
    data << dataRe
    res = {:data => data}
    res[:data_error] = data_err #if data_err and data_err.length > 0
    res[:error] = err_code if err_code
    respond_to do |format|
      format.json do
        render json: res.to_json(:root => API_URLS, :except => EXCEPT_FIELDS)
      end
    end
  end
end
