class SendMail < ApplicationRecord
  self.table_name = "send_mail"
  self.primary_key = "id"
  
  def self.create_default_mail(toEmail)
    mails = ARR_EMAIL_DEF
    if mails and mails.length > 0
      mails.each do |obj|
        item = SendMail.new()
        item.to_email = toEmail.to_s
        item.subject = obj[:subject]
        item.template = obj[:template]
        item.save
      end
    end
  end
  
  #insert send mail 
  def self.insert_send_mail(objs)
    if objs and objs.length > 0
      objs.each do |obj|
        item = SendMail.new()
        item.to_email = obj[:to_email]
        item.subject = obj[:subject]
        item.template = obj[:template]
        item.percent = obj[:percent] ? obj[:percent] : 0
        item.upgradeTo = obj[:upgradeTo] ? obj[:upgradeTo] : ''
        item.save        
      end
    end
  end
end
