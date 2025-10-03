class Addressbook < ApplicationRecord
  self.table_name = "addressbooks"
  self.primary_key = "id"

  # before_create :set_create_time
  # before_update :set_update_time

  has_many :addressbookchanges, foreign_key: 'addressbookid', dependent: :destroy
  validates :uri, :presence => true

  attr_accessor :ref
  def self.fields
    return ['id', 'displayname', 'principaluri', 'uri', 'description', 'synctoken']
  end

  def self.delete_all_addressbook(principal, ids)
    where(principaluri: principal, id: ids.split(',')).delete_all
  end

  #get URI just support for app
  def self.getURI(principal, pItem, pNumber, ad_uri)
    if ad_uri and ad_uri.to_s.length > 0
      sql = " SELECT ca.uri AS ca_uri "
      sql << " FROM cards AS ca "
      sql << " LEFT JOIN addressbooks AS ad ON ca.addressbookid = ad.id "
      sql << " WHERE ad.principaluri = :principal AND ad.uri = :uri"
      sql << " ORDER BY ca_uri ASC "
      if (pItem.to_i != 0) and (pNumber.to_i != 0)
        sql << " LIMIT "
        sql << ((pNumber.to_i * pItem.to_i) - pItem.to_i).to_s
        sql << ","
        sql << (pItem.to_i).to_s
      end

      find_by_sql([sql, {:principal => principal, :uri => ad_uri}])
    else #get by page
      sql = " SELECT ad.uri AS ad_uri, ca.uri AS ca_uri "
      sql << " FROM addressbooks AS ad "
      sql << " LEFT JOIN cards AS ca ON ca.addressbookid = ad.id "
      sql << " WHERE ad.principaluri = ? "
      sql << " ORDER BY ad_uri ASC "
      if (pItem.to_i != 0) and (pNumber.to_i != 0)
        sql << " LIMIT "
        sql << ((pNumber.to_i * pItem.to_i) - pItem.to_i).to_s
        sql << ","
        sql << (pItem.to_i).to_s
      end

      find_by_sql([sql, principal])
    end
  end

  def self.uris(principal, pItem, ad_uri, min_id)
    if ad_uri and ad_uri.to_s.length > 0
      sql = " SELECT ca.id, ca.uri AS ca_uri "
      sql << " FROM cards AS ca "
      sql << " LEFT JOIN addressbooks AS ad ON ca.addressbookid = ad.id "
      sql << " WHERE ad.principaluri = :principal AND ad.uri = :uri"
      sql << " AND ca.id > :min_id "
      sql << " ORDER BY ca.id ASC "
      if pItem.to_i != 0
        sql << " LIMIT :p_item"
      end

      find_by_sql [sql, { principal: principal, uri: ad_uri, min_id: min_id.to_i, p_item: pItem.to_i }]
    else #get by page
      sql = " SELECT ca.id, ad.uri AS ad_uri, ca.uri AS ca_uri "
      sql << " FROM addressbooks AS ad "
      sql << " LEFT JOIN cards AS ca ON ca.addressbookid = ad.id "
      sql << " WHERE ad.principaluri = :principal "
      sql << " AND ca.id > :min_id "
      sql << " ORDER BY ca.id ASC "
      if pItem.to_i != 0
        sql << " LIMIT :p_item "
      end

      find_by_sql [sql, { principal: principal, min_id: min_id.to_i, p_item: pItem.to_i }]
    end
  end

  # rubocop:disable Metrics/ParameterLists
  def self.getChangesURI(principal, pItem, pNumber, ad_uri, sync_token, min_id)
    sql = " SELECT adc.synctoken, adc.id, adc.uri as href, adc.operation as action, cd.etag "
    sql << " FROM addressbookchanges  AS adc "
    sql << " LEFT JOIN addressbooks AS ad ON ad.id = adc.addressbookid "
    sql << " LEFT JOIN cards AS cd ON cd.uri = adc.uri "
    sql << " WHERE ad.principaluri = :principal "
    sql << " AND ad.uri = :ad_uri "
    sql << " AND adc.synctoken >= :sync_token "

    if min_id.to_i != 0
      sql << " AND adc.id > :min_id "
    end

    # group duplicate item
    sql << " GROUP BY adc.id "

    sql << " ORDER BY adc.id ASC "
    if pItem.to_i != 0
      if pNumber.to_i != 0
        sql << " LIMIT "
        sql << ((pNumber.to_i * pItem.to_i) - pItem.to_i).to_s
        sql << ","
        sql << (pItem.to_i).to_s

      else
        sql << " LIMIT 0"
        sql << ","
        sql << (pItem.to_i).to_s
      end
    end

    find_by_sql([sql, { principal: principal, ad_uri: ad_uri, sync_token: sync_token, min_id: min_id }])
  end
  # rubocop:enable Metrics/ParameterLists
end
