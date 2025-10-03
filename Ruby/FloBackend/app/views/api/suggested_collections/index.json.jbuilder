json.data @suggested_collections do |suggested_collection|
  attr = suggested_collection.attributes.keys
  json.suggested_collection do
    json.id suggested_collection.id if attr.include? 'id'
    json.criterion_type suggested_collection.criterion_type if attr.include? 'criterion_type'
    json.criterion_value suggested_collection.criterion_value if attr.include? 'criterion_value'
    json.created_date suggested_collection.created_date if attr.include? 'created_date'
    json.updated_date suggested_collection.updated_date if attr.include? 'updated_date'
    json.frequency_used suggested_collection.frequency_used if attr.include? 'frequency_used'
    if suggested_collection.identical_senders.present?
      json.identical_senders suggested_collection.identical_senders do |sender|
        json.email_address sender.email_address
      end
    end
    json.project_id suggested_collection.project_id if attr.include? 'project_id'
  end
end
