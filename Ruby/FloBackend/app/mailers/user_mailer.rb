class UserMailer < ActionMailer::Base
  default :from => API_FROM_EMAIL.to_s #"Flow Online <noreply@123flo.com>"

  #send mail defaul
  def send_mails_default(email)
    Thread.new do
      UserMailer.welcome_email(email).deliver_now
      # ActiveRecord::Base.connection.close
    # end
    # Thread.new do
      UserMailer.flo_tips1(email).deliver_now
      # ActiveRecord::Base.connection.close
    end
    Thread.new do
      UserMailer.flo_tips2(email).deliver_now
      # ActiveRecord::Base.connection.close
    # end
    # Thread.new do
      UserMailer.flo_tips3(email).deliver_now
      # ActiveRecord::Base.connection.close  
    end
  end
  
  #send mail terminate Flo account
  def send_mail_terminate_flo(flomail, to_email, url_del)
    @flomail = flomail
    @to_email = to_email
    @url_del = url_del
    @url  = HTTP_HOST_NAME_FOR_BETA
    subj = API_TERMINATE_EMAIL_SUBJ.to_s + "["+ flomail.to_s + "]"
    
    from_email = API_FROM_EMAIL.to_s #"Flow Online <noreply@123flo.com>"
    mail(:from => from_email, :to => to_email.to_s.strip.downcase,
         :subject => subj)
  end
  
  #send to 3rd account
  def flo_send_3rd_account(email, floEmail = '')
    @email = email.to_s.strip.downcase
    @floEmail = floEmail.to_s.strip.downcase
    subj = API_SEND_3RD_SUBJ.to_s
    subj = subj.gsub("@acc@", @email.to_s)
    @url  = HTTP_HOST_NAME_FOR_BETA
    from_email = API_FROM_EMAIL.to_s 
    mail(:from => from_email, :to => @email,
         :subject => subj)
  end
  
  #for welcome email version
  def welcome_email(email)
    @email = email
    @url  = HTTP_HOST_NAME_FOR_BETA
    # from_email = "Flow Online <noreply@flow-mail.com>"
    from_email = API_FROM_EMAIL.to_s #"Flow Online <noreply@123flo.com>"
    mail(:from => from_email, :to => email.to_s.strip.downcase,
         :subject => API_WELCOME_SUBJ.to_s)
  end
  
  def flo_tips1(email)
    @email = email
    @url  = HTTP_HOST_NAME_FOR_BETA.to_s + '/images/'#HTTP_HOST_NAME_BG
    # from_email = "Flow Online <noreply@flow-mail.com>"
    from_email = API_FROM_EMAIL.to_s #"Flow Online <noreply@123flo.com>"
    mail(:from => from_email, :to => email.to_s.strip.downcase,
         :subject => API_TIP_SUBJ_1.to_s)
  end
  
  def flo_tips2(email)
    @email = email
    @url  = HTTP_HOST_NAME_FOR_BETA.to_s + '/images/'#HTTP_HOST_NAME_BG
    # from_email = "Flow Online <noreply@flow-mail.com>"
    from_email = API_FROM_EMAIL.to_s #"Flow Online <noreply@123flo.com>"
    mail(:from => from_email, :to => email.to_s.strip.downcase,
         :subject => API_TIP_SUBJ_2.to_s)
  end
  
  def flo_tips3(email)
    @email = email
    @url  = HTTP_HOST_NAME_FOR_BETA.to_s + '/images/'#HTTP_HOST_NAME_BG
    # from_email = "Flow Online <noreply@flow-mail.com>"
    from_email = API_FROM_EMAIL.to_s #"Flow Online <noreply@123flo.com>"
    mail(:from => from_email, :to => email.to_s.strip.downcase,
         :subject => API_TIP_SUBJ_3.to_s)
  end
  
  #for recover password
  def recoverpass_email(user)
    @email = user.email
    @user = user
    @urlConfirm  = HTTP_HOST_NAME_FOR_BETA.to_s + "/#/reset?token=" + user.token.to_s
    @url  = HTTP_HOST_NAME_FOR_BETA
    @subj = API_RECOVER_PASS_SUBJ.to_s  + @email.to_s
    # from_email = "Flow Online <noreply@flow-mail.com>"
    from_email = API_FROM_EMAIL.to_s
    mail(:from => from_email, :to => user.secondary_email.to_s.strip.downcase,
         :subject => @subj)
  end
  
  # verify secondary email
  def verify_secondary_email(user)
    @email = user.email
    @user = user
    @host = HTTP_HOST_NAME_FOR_BETA.to_s
    @email_support = API_FROM_EMAIL_SUPPORT.to_s
    @url  = HTTP_HOST_NAME_FOR_BETA.to_s + "/verify?token=" + user.token.to_s + "&email=" + @email.to_s
    from_email = API_FROM_EMAIL.to_s #"Flow Online <noreply@flow-mail.com>"
    mail(:from => from_email, :to => user.secondary_email.to_s.strip.downcase,
         :subject => API_SECONDARY_EMAIL_SUBJ.to_s)
  end
  
  #send meeting invite
  def send_mi(fromEmail, email, subject, body, status, icsFile)
    @url  = HTTP_HOST_NAME
    @body_html = body
    from_email = fromEmail ? fromEmail.to_s : API_FROM_EMAIL.to_s 
    attach_file = icsFile ? icsFile.to_s : ""
    if status and status.to_s == 'true'
     attachments['meeting_invite.ics'] = {:mime_type => 'application/ics',:content => attach_file } #
    end
    subject = subject ? subject : "Meeting invite" 
    mail(:from => from_email, :to => email.to_s.strip.downcase,
         :subject => subject)
  end

  def remove_member_from_collection(email_to, shared_collection_name)
    @shared_collection_name = shared_collection_name
    mail(to: email_to.strip.downcase,
         subject: "Flo Shared Collection - Change in Access Rights").deliver_now
  end

  def delete_collection(email_to, shared_collection_name)
    @shared_collection_name = shared_collection_name
    mail(to: email_to.strip.downcase,
         subject: "Flo Shared Collection Deleted").deliver_now
  end
end
