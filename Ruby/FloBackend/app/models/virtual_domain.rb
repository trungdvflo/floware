class VirtualDomain < ApplicationRecord
  self.table_name = "virtual_domains"
  self.primary_key = "id"
end
