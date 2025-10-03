class SubFeature < ApplicationRecord
  self.table_name = "subscription_features"
  self.primary_key = "id"

  def self.get_all_features
    features = SubFeature.all
    res = []
    if features and features.length > 0
      features.each do |ft|
        obj = {}
        # obj[:id] = ft.id
        obj[:name] = ft.name
        obj[:feature_type] = ft.feature_type
        res << obj
      end
    end
    return res
  end
end
