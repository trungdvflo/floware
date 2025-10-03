json.data @set_accounts do |set_account|
  json.set_accounts do
    json.merge! set_account.attributes
                           .except('user_id','pass_income', 'pass_smtp',
                                   'auth_key', 'auth_token', 'provider', 'refresh_token',
                                   'activated_push', 'token_expire')
    begin
      json.account_sync JSON.parse(set_account.account_sync)
    rescue
    end
  end
end

if @set_accounts_deleted
  json.data_del @set_accounts_deleted do |set_account_deleted|
    json.set_accounts do
      json.merge! set_account_deleted.attributes.except('user_id')
    end
  end
end
