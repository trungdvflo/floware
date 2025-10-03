json.data @set_accounts do |set_account|
  json.set_accounts do
    json.merge! set_account.attributes.merge(ref: set_account.ref)
                           .except('user_id','pass_income', 'pass_smtp',
                                   'auth_key', 'auth_token', 'provider', 'refresh_token',
                                   'activated_push', 'token_expire')
    begin
      json.account_sync JSON.parse(set_account.account_sync)
    rescue
    end
  end
end

if @set_accounts_errors.present?
  json.data_error @set_accounts_errors do |set_account|
    json.merge! set_account
    if set_account[:account_sync].present?
      begin
        json.account_sync JSON.parse(set_account.account_sync)
      rescue
      end
    end
  end
end
