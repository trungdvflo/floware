class Quota < ApplicationRecord
  self.table_name = "quota"
  self.primary_key = "username"
  
  
  def self.update_quota(email, options = nil)
    sql = " username = '" + email.to_s + "'"
    quota = Quota.where(sql).first
    if quota #update quota if it existed
      quota.cal_bytes = options[:cal_bytes] if options[:cal_bytes]
      quota.card_bytes = options[:card_bytes] if options[:card_bytes]
      quota.file_bytes = options[:file_bytes] if options[:file_bytes]
      quota.save
    else #create new row for quota
      quotaNew = Quota.new()
      quotaNew.username = email.to_s.strip
      quotaNew.cal_bytes = options[:cal_bytes] if options[:cal_bytes]
      quotaNew.card_bytes = options[:card_bytes] if options[:card_bytes]
      quotaNew.file_bytes = options[:file_bytes] if options[:file_bytes]
      quotaNew.save
    end
  end
end
