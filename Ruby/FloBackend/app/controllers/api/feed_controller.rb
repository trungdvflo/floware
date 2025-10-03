class Api::FeedController < Api::BaseController
 
  require 'rss/1.0'
  require 'rss/2.0'
 
  def getWeatherInfo
    begin
      q=params[:q]
      key=params[:key]
      url_contents = Net::HTTP.get(URI.parse("http://api.worldweatheronline.com/free/v1/weather.ashx?key="+key+"&q="+q+"&num_of_days=1&format=xml"))
      #url_contents = Net::HTTP.get(URI.parse(params[:url]))
      #rss = RSS::Parser.parse(url_contents, false)
      #json = { "error" => false, "feed" => rss }.to_json
      json = { "error" => false, "feed" => url_contents}.to_json
    rescue
      json = { "error" => true }.to_json
    end
    respond_to do |format|
      format.js { render_json json }
    end
  end
  
  def getLocationInfo
    begin
      q=params[:query]
      key=params[:key]
      # url_contents= Net::HTTP.get(URI.parse("http://www.worldweatheronline.com/feed/search.ashx?key="+key+"&query="+q+"&num_of_results=1&format=xml"));
      url_contents= Net::HTTP.get(URI.parse("http://maps.googleapis.com/maps/api/geocode/xml?latlng="+q+"&sensor=true"))
      json = { "error" => false, "feed" => url_contents}.to_json
    rescue
      json = { "error" => true }.to_json
    end
    respond_to do |format|
      format.js { render_json json }
    end
  end
  
  def getNewsList
    begin
      url_contents = Net::HTTP.get(URI.parse(params[:url]))
      #rss = RSS::Parser.parse(url_contents, false)
      #json = { "error" => false, "feed" => rss }.to_json
      json = { "error" => false, "feed" => url_contents }.to_json
    rescue
      json = { "error" => true }.to_json
    end
    respond_to do |format|
      format.js { render_json json }
    end
  end
 
  def render_json(json)
    callback = params[:callback]
    response = begin
      if callback
        "#{callback}(#{json});"
      else
        json
      end
    end
    render({:content_type => :js, :text => response})
  end
end
