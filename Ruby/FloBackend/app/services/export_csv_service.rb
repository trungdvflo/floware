class ExportCSVService
  def initialize(objects, attributes, headers)
    @attributes = attributes
    @objects = objects
    @headers = headers
  end

  def perform
    CSV.generate do |csv|
      csv << headers

      objects.each do |obj|
        csv << attributes.map { |attr| obj.send(attr) }
      end
    end
  end

  private

  attr_reader :attributes, :objects, :headers
end
