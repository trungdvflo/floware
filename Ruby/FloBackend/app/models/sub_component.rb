class SubComponent < ApplicationRecord
  self.table_name = "subscription_components"
  self.primary_key = "id"

  #get all subscription
  def self.get_components
    comps = SubComponent.all
    res = []
    if comps and comps.length > 0
      comps.each do |comp|
        obj = {}
        obj[:id] = comp.id
        obj[:name] = comp.name
        obj[:comp_type] = comp.comp_type
        res << obj
      end
    end
    return res
  end
end
