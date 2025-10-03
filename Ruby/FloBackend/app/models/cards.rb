class Cards < ApplicationRecord
  self.table_name = "cards"
  self.primary_key = "id"
  # after_destroy :del_links
  
  def self.fields
    return ['id','addressbookid', 'uri', 'carddata', 'lastmodified']
  end    
  
  def type
    attributes["type"]
  end
  
  #subscription: get total size of calDAV
  def self.get_total_size_carddav(email)
    sql = " SELECT SUM(c.size) AS total FROM cards c "
    sql << " LEFT JOIN addressbooks ad ON ad.id = c.addressbookid "
    sql << " WHERE ad.principaluri = :email"
    find_by_sql([sql, { email: API_PRINCIPAL + email }])
  end
  
  # component_type: default = get all calendar objects
  def self.get_cards(email = '', uris = nil, cur_items = nil, next_items = nil, except_uids = nil)
    sql = " SELECT c.id, c.uri, c.carddata, ad.uri as calendar_uri"
    sql << " FROM cards c , addressbooks ad"
    sql << " WHERE c.addressbookid = ad.id AND ad.principaluri = ?"
    email = email.clone
    matchData = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/.match(email)
    if matchData.present?
      email = matchData[0]
    end
    principals = 'principals/' 
    principals << email
    
    if !except_uids.nil? && !except_uids.blank?
      sql << " AND c.uri NOT IN ("+ except_uids.to_s + ")"
    end

    if !uris.nil? && !uris.blank?
      sql << " AND c.uri in (?)"
      
      if !cur_items.nil? && !cur_items.blank?
        sql <<  " ORDER BY c.lastmodified"
        sql << " LIMIT #{cur_items.to_i},#{next_items.to_i}"
        find_by_sql([sql, principals, uris])
      else
        find_by_sql([sql, principals, uris])
      end
    else
      
      if !cur_items.nil? && !cur_items.blank?
        sql <<  " ORDER BY c.lastmodified"
        sql << " LIMIT #{cur_items.to_i},#{next_items.to_i}"
        find_by_sql([sql, principals])
      else
        find_by_sql([sql, principals])
      end
    end
  end

  def self.build_sql_get_cards_by_collection_id(email = '', uris = nil, cur_items = nil, next_items = nil, except_uids = nil, collection_id = nil, is_card_source = true, order_by = false)
    sql = "SELECT c.id, c.uri, c.carddata, ad.uri as calendar_uri, c.lastmodified as card_last_modified
            FROM cards as c
            LEFT JOIN addressbooks ad ON c.addressbookid = ad.id"
    
    if is_card_source
      sql << " LEFT JOIN links l ON c.uri = CONCAT(l.source_id, '.vcf')
               WHERE ad.principaluri = :principaluri
                    AND l.source_type = 'VCARD' AND l.destination_id = :collection_id"
    else
      sql << " LEFT JOIN links l ON c.uri = CONCAT(l.destination_id, '.vcf') AND l.destination_type = 'VCARD'
               WHERE ad.principaluri = :principaluri
                    AND l.destination_type = 'VCARD' AND l.source_id = :collection_id"
    end

    email = email.clone
    matchData = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/.match(email)
    if matchData.present?
      email = matchData[0]
    end

    conditions = {
      'principaluri': 'principals/' + email,
      'collection_id': collection_id.to_s
    }
    
    if !except_uids.nil? && !except_uids.blank?
      sql << " AND c.uri NOT IN (:except_uids)"
      conditions[:except_uids] = except_uids.to_s
    end

    if !uris.nil? && !uris.blank?
      sql << " AND c.uri in (:uri)"
      conditions[:uri] = uris
    end

    if !cur_items.nil? && !cur_items.blank? && order_by
      sql <<  " ORDER BY card_last_modified"
      sql << " LIMIT #{cur_items.to_i},#{next_items.to_i}"
    end

    return {
      'sql': sql,
      'conditions': conditions
    }
  end

  def self.get_cards_by_collection_id(email = '', uris = nil, cur_items = nil, next_items = nil, except_uids = nil, collection_id = nil)
    card_source_sql = build_sql_get_cards_by_collection_id(email, uris, cur_items, next_items, except_uids, collection_id, true)
    card_des_sql = build_sql_get_cards_by_collection_id(email, uris, cur_items, next_items, except_uids, collection_id, false, true)
    conditions = card_source_sql[:conditions]

    sql = card_source_sql[:sql]
    sql <<' UNION '
    sql << card_des_sql[:sql]

    find_by_sql([sql, conditions])
  end

  #count todo and note
  def self.count_calendar_obj(email)
    sql = "SELECT ("
    sql << 'SELECT COUNT(*) AS todo FROM calendarobjects co WHERE componenttype= "VTODO" AND calendarid IN (SELECT id FROM calendars WHERE principaluri = ?)'
    sql << ") AS todo, ("
    sql << 'SELECT COUNT(*) AS note FROM calendarobjects co WHERE componenttype= "VJOURNAL" AND calendarid IN (SELECT id FROM calendars WHERE principaluri = ?)'
    sql << ") AS note"
    principals = 'principals/' 
    principals << email
    find_by_sql([sql, principals, principals])
  end
  
  # get card data for link
  def self.get_card_data(ids, email)
    ids = ids.map{ |x| x + '.vcf' }

    sql = %|SELECT c.id, c.uri, c.carddata, ad.uri as calendar_uri
          FROM cards c 
          INNER JOIN addressbooks ad ON c.addressbookid = ad.id
          WHERE c.uri in (:ids)|

    res = find_by_sql([sql, {ids: ids}])

    _format_card(res, email)
  end

  def self.seach_contact_by_qs(qs, email)
      qs_arr =  qs.downcase.split(" ")
      querry = qs.clone
      matchData = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/.match(qs)
      if matchData.present?
        querry = matchData[0]
      end
      
      # if qs_arr.length == 1
      #   if qs[qs.length - 1] == '@'
      #     querry = qs.gsub('@', '*')
      #   end
      # end

      querry.gsub!(/@/, " ");
      querry.strip!()
      querry.gsub!(" ", "*");
      if qs_arr.length >= 2
        querry = "#{qs_arr[0].downcase} #{qs_arr[-1].downcase}"
      end
      sql = %|SELECT c.id, c.uri, c.carddata, ad.uri as calendar_uri
      FROM cards c 
      INNER JOIN addressbooks ad ON c.addressbookid = ad.id
      WHERE ad.principaluri = ?
      AND (MATCH (c.carddata) AGAINST (? IN BOOLEAN MODE)) limit 10|
      res = find_by_sql([sql, "principals/" + email, "+" + querry + "*"])
      _filter_card(res, email, qs.downcase)
  end

  def self.fulltext_seach_contact_by_qs(qs, email)
      qs_arr =  qs.downcase.split(" ")
      querry = qs.clone
      matchData = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/.match(qs)
      if matchData.present?
        querry = matchData[0]
      end
      querry.gsub!(/@/, " ");
      querry.strip!()
      querry.gsub!(" ", "*");
      if qs_arr.length >= 2
        querry = "#{qs_arr[0].downcase} #{qs_arr[-1].downcase}"
      end
      sql = %|SELECT c.id, c.uri, c.carddata, ad.uri as calendar_uri
      FROM cards c 
      INNER JOIN addressbooks ad ON c.addressbookid = ad.id
      WHERE ad.principaluri = ?
      AND (MATCH (c.carddata) AGAINST (? IN BOOLEAN MODE)) limit 10|
  
      res = find_by_sql([sql, "principals/" + email, "+" + querry + "*"])
      _filter_card(res, email, qs.downcase)
  end

  def self.get_first_contact_by_email_addr(principal_email_addr, email_addr)
    sql = "SELECT c.id, c.uri, c.carddata, ad.uri as calendar_uri "
    sql << "FROM cards c "
    sql << "INNER JOIN addressbooks ad ON c.addressbookid = ad.id "
    sql << "WHERE ad.principaluri = ? "
    sql << "AND c.carddata REGEXP ? limit 1"
  
    res = find_by_sql([sql, "principals/" + principal_email_addr, 
      "EMAIL;TYPE=INTERNET;TYPE=PREF:" + email_addr + 
      "|EMAIL;TYPE=INTERNET:" + email_addr])
    _format_card(res, principal_email_addr)
  end

  def self.seach_contact_by_email(qs, email)
    sql = %|SELECT c.id, c.uri, c.carddata, ad.uri as calendar_uri
    FROM cards c 
    INNER JOIN addressbooks ad ON c.addressbookid = ad.id
    WHERE ad.principaluri = ?|

    res = find_by_sql([sql, "principals/" + email])
    __filter_by_search_term(res, email, qs)
  end

  def self.del_links(user_id, uid)
    ActiveRecord::Base.transaction do
      links = Link.where(user_id: user_id).where("source_id IN (?) or destination_id IN (?)", uid, uid)
      logger.ap "---------------------", :warn
      logger.ap links, :warn
      links.each do |link|
        item = DeletedItem.new
        item.item_type = API_TRASH
        item.user_id = user_id
        item.item_id = link.source_id == uid ? link.destination_id : link.source_id
        item.is_recovery = 0
        item.save
      end
      links.delete_all
    end
  end

  private
  def self._format_card(cards, email)
    contacts = []
    root = "/addressbookserver.php/addressbooks/#{email}/"

    cards.each do |x|
      vcards = Vpim::Vcard.decode(x.carddata)

      vcards.each do |contact|            
        #remove the photo
        ct_fields = contact.fields.reject{ |f|
          f.name.eql?("PHOTO")
        }
        
        contact_str = ct_fields.join("\r\n")

        contacts << {
          href: root + x.calendar_uri.to_s + "/" + x.uri.to_s,
          data: contact_str,
          type: "VCARD",
          uri: x.uri,
          has_photo: contact.field("PHOTO") ? 1 : 0
        }
      end
    end

    contacts
  end

  def self._filter_card(cards, email, qs)
    root = "/addressbookserver.php/addressbooks/#{email}/"
    rs = Array.new
    qs_arr = qs.downcase.split(" ")
    cards.each do |x|
      vcard = Vpim::Vcard.decode(x.carddata)

      vcard.each do |contact|
        valid = false
        contact.fields.each do |f|
          #TODO: advance setting contact
          if qs_arr.length == 1
            if f.name.eql?("N") || f.name.eql?("FN")
              if !f.value.downcase.index(qs.downcase).nil?
                valid = true
                break
              end
            end
          end
          if qs_arr.length >= 2
            if f.name.eql?("N") || f.name.eql?("FN")
              if !f.value.downcase.index(qs_arr[0]).nil? && !f.value.downcase.index(qs_arr[-1]).nil?
                valid = true
                break
              end
            end
          end
          
          if f.name.eql?("ORG")
          # if f.name.eql?("ORG") || f.name.eql?("TITLE")
            if !f.value.downcase.index(qs.downcase).nil? 
              valid = true
              break
            end
          end  

          if f.name.eql?("EMAIL") && qs_arr.length == 1
            if f.value.downcase.index(qs.downcase) === 0 || #by name
              (qs[0].eql?("@") && !f.value.downcase.index(qs.downcase).nil?) || #by organization  
              (!qs[0].eql?("@") && !f.value.downcase.index('@' + qs.downcase).nil?) 
              valid = true
              break
            end
          end
        end #end contact.fields
        
        if valid
          #remove the photo
          ct_fields = contact.fields.reject{ |f|
            f.name.eql?("PHOTO")
          }

          contact_str = ct_fields.join("\r\n")
          
          ct = {
            :href => root + x.calendar_uri.to_s + "/" + x.uri.to_s,
            :data => contact_str,
            :type => "VCARD",
            :uri => x.uri,
            :has_photo => contact.field("PHOTO") ? 1 : 0
          }
          rs.push(ct)
        end
      end #end vcard each
    end #end cards.each
    rs
  end

  def self.__filter_by_search_term(cards, email, qs)
    root = "/addressbookserver.php/addressbooks/#{email}/"
    rs = Array.new

    cards.each do |x|
      vcard = Vpim::Vcard.decode(x.carddata)

      vcard.each do |contact|
        valid = false
        contact.fields.each do |f|
          if f.name.eql?("N") || f.name.eql?("ORG")
            if !f.value.downcase.index(qs).nil? || !f.value.downcase.index(' ' + qs).nil? 
              valid = true
              break
            end
          end
          
          if f.name.eql?("EMAIL")
            if f.value.downcase.index(qs) === 0 || #by name
              (qs[0].eql?("@") && !f.value.downcase.index(qs).nil?) || #by organization  
              (!qs[0].eql?("@") && !f.value.downcase.index('@' + qs).nil?) 
              valid = true
              break
            end
          end
        end #end contact.fields
        
        if valid
          #remove the photo
          ct_fields = contact.fields.reject{ |f|
            f.name.eql?("PHOTO")
          }

          contact_str = ct_fields.join("\r\n")
          
          ct = {
            :href => root + x.calendar_uri.to_s + "/" + x.uri.to_s,
            :data => contact_str,
            :type => "VCARD",
            :uri => x.uri
          }
          rs.push(ct)
        end
      end #end vcard each
    end #end cards.each
    rs
  end
end

