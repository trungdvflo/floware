class Subscription < ApplicationRecord
  self.table_name = "subscriptions"
  self.primary_key = "id"

  has_many :subscription_purchases, class_name: 'SubPurchase', foreign_key: :subID

  #get all subscription
  def self.get_subscriptions
    subs = Subscription.all
    res = []
    if subs and subs.length > 0
      subs.each do |sub|
        obj = {}
        obj[:id] = sub.id
        obj[:name] = sub.name
        obj[:price] = sub.price
        obj[:period] = sub.period
        obj[:auto_renew] = sub.auto_renew
        obj[:description] = sub.description
        obj[:subs_type] = sub.subs_type
        res << obj
      end
    end
    return res
  end
  
  #get subscription by structure
  def self.get_subs_by_structure
    subs = Subscription.all
    res = []
    if subs and subs.length > 0
      subs.each do |sub|
        obj = {}
        obj[:id] = sub.id
        obj[:name] = sub.name
        obj[:price] = sub.price
        obj[:period] = sub.period
        obj[:auto_renew] = sub.auto_renew
        obj[:description] = sub.description
        obj[:subs_type] = sub.subs_type
        obj[:components] = SubDetail.get_all_subs_detail(sub.id)
        res << obj
      end
    end
    return res
  end
end
