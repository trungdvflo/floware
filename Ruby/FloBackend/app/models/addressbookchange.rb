class Addressbookchange < ApplicationRecord
  self.table_name = "addressbookchanges"
  self.primary_key = "id"

  belongs_to :addressbook
end
