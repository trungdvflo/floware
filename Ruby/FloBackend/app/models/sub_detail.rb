class SubDetail < ApplicationRecord
  self.table_name = "subscription_details"
  self.primary_key = "id"

  def self.getFreeAccount
    sql = " SELECT sd.*, sc.name, sc.comp_type, s.name AS subs_name, s.price, s.period, s.auto_renew, s.subs_type "
    sql << " ,s.description "
    sql << " FROM subscription_details sd "
    sql << " LEFT JOIN subscriptions s ON s.id = sd.subID "
    sql << " LEFT JOIN subscription_components sc ON sc.id = sd.comID "
    sql << " WHERE s.subs_type = 0 "
    freeAcc = SubDetail.find_by_sql(sql)
    info = {}
    
    #collect information of free account
    if freeAcc and freeAcc.length > 0
      freeAcc.each do |fa|
        if fa.comp_type.to_i == API_COMP_STORAGE_TYPE.to_i
          info[:subID] = fa.subID #subscription ID
          info[:storage] = fa.sub_value 
          info[:name] = fa.subs_name
          info[:price] = fa.price
          info[:period] = fa.period
          info[:auto_renew] = fa.auto_renew
          info[:subs_type] = fa.subs_type
          info[:description] = fa.description
        end
        info[:number_3rd_acc] = fa.sub_value if fa.comp_type.to_i == API_COMP_3RD_TYPE
      end
    end
    return info
  end
  
  #get subscription detail
  def self.get_subs_detail(subID, used, nuber3rd)
    sql = " SELECT sd.*, sc.comp_type, sc.name "
    sql << " FROM subscription_details sd "
    sql << " LEFT JOIN subscription_components sc ON sc.id = sd.comID "
    sql << " WHERE sd.subID = :sub_id"
    infos = []
    subs = SubDetail.find_by_sql([sql, {sub_id: subID}])
    if subs and subs.length > 0
      subs.each do |sub|
        obj = {}
        #for storage
        if sub.comp_type.to_i == API_COMP_STORAGE_TYPE.to_i
          obj[:used] = used
          #change to bytes
          sub.sub_value = sub.sub_value * 1024*1024*1024 
        end
        #for 3rd party account
        if sub.comp_type.to_i == API_COMP_3RD_TYPE.to_i
          obj[:used] = nuber3rd ? nuber3rd.length : 0
        end
        #get features
        if sub.comp_type.to_i == API_COMP_FEATURE_TYPE
          obj[:features] = SubFeature.get_all_features()
        end
        obj[:name] = sub.name
        obj[:comp_type] = sub.comp_type
        obj[:sub_value] = sub.sub_value
        obj[:description] = sub.description
        infos << obj
      end
    end
    return infos
  end
  
  #get subscription detail
  def self.get_all_subs_detail(subID)
    sql = " SELECT sd.*, sc.comp_type, sc.name "
    sql << " FROM subscription_details sd "
    sql << " LEFT JOIN subscription_components sc ON sc.id = sd.comID "
    sql << " WHERE sd.subID = :sub_id"
    infos = []
    subs = SubDetail.find_by_sql([sql, {sub_id: subID}])
    if subs and subs.length > 0
      subs.each do |sub|
        obj = {}
        if sub.comp_type.to_i == API_COMP_STORAGE_TYPE.to_i
          #change to bytes
          obj[:sub_value] = sub.sub_value * 1024*1024*1024
        else 
          obj[:sub_value] = sub.sub_value
        end
        obj[:description] = sub.description
        obj[:name] = sub.name
        obj[:comp_type] = sub.comp_type
        #get feature
        if sub.comp_type and sub.comp_type.to_i == API_COMP_FEATURE_TYPE
          obj[:features] = SubFeature.get_all_features()
        end
        infos << obj
      end
    end
    return infos
  end

  #get all subscription details
  def self.get_subscriptions_details
    subDetails = SubDetail.all
    res = []
    if subDetails and subDetails.length > 0
      subDetails.each do |sub|
        obj = {}
        obj[:id] = sub.id
        obj[:subID] = sub.subID
        obj[:comID] = sub.comID
        obj[:sub_value] = sub.sub_value
        obj[:description] = sub.description
        res << obj
      end
    end
    return res
  end
end
