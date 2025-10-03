class PushNotiqueue < ApplicationRecord
  self.table_name = "push_noti_queue"
  self.primary_key = "id"
  
  def self.insert_push_noti(notiItem)
    obj = PushNotiqueue.new()
    obj.user_id = notiItem[:user_id]
    obj.email = notiItem[:email].to_s
    obj.message = Base64.encode64(notiItem[:message].to_json.to_s)
    obj.save
  end
end
