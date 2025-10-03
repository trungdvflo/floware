class VirtualAlias < ApplicationRecord
  self.table_name = "virtual_aliases"
  self.primary_key = "id"

  validates :source, :presence => true, :uniqueness => { :scope => [:destination], :case_sensitive => false, :message => " is already exists."}
end
