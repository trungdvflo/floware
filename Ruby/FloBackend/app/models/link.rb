load 'lib/encode_decode_base64.rb'
# links.source_account includes case source_type the same (source_type = destination_type)
class Link < Base
  include EncodeDecodeBase64
  include CommonScopes
  self.table_name = "links"
  self.primary_key = "id"

  require 'digest/md5'
  require 'digest'
  #for RSA
  require 'openssl'
  require 'base64'
  require 'json'

  attr_accessor :ref

  # belongs_to :source_project, class_name: 'Project', foreign_key: :source_id
  # belongs_to :destination_project, class_name: 'Project', foreign_key: :destination_id
  before_create :set_create_time
  before_update :set_update_time

  validates :source_type, :presence => true, :allow_blank => false
  validates :destination_type, :presence => true, :allow_blank => false
  validates :source_id, :presence => true, :allow_blank => false
  validates :destination_id, :presence => true, :allow_blank => false
  validates_uniqueness_of :source_id, scope: [:source_type, :destination_type,
                                              :user_id, :source_account,
                                              :destination_account, :destination_id,
                                              :source_root_uid, :source_root_uid, :destination_root_uid
  ]
  validates :source_type, inclusion: { in: ['VEVENT', 'VTODO', 'VJOURNAL', 'EMAIL', 'NEW_EMAIL',
                                            'VCARD', 'URL', 'FILE' ,'FOLDER'] }
  validates :destination_type, inclusion: { in: ['VEVENT', 'VTODO', 'VJOURNAL', 'EMAIL', 'NEW_EMAIL',
                                                 'VCARD', 'URL', 'FILE' ,'FOLDER'] }
  validates :source_account, numericality: { only_integer: true }, if:  Proc.new { |object| object.source_account.present? }
  validates :destination_account, numericality: { only_integer: true }, if:  Proc.new { |object| object.destination_account.present? }

  validate :third_party_account_exist?
  validate :email_valid?
  validate :root_uid_valid?
  validate :meta_data_valid?, if: :meta_data_changed?
  validate :exist?
  validate :link_itself?

  EMAIL_PATTERN = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

  def third_party_account_exist?
    if source_account.to_i != 0
      third_party_account = SetAccount.find_by(id: source_account, user_id: user_id)
      if third_party_account.blank?
        errors.add(:source_account, 'should be exist')
        return false
      end
    end
    if destination_account.to_i != 0
      third_party_account = SetAccount.find_by(id: destination_account, user_id: user_id)
      if third_party_account.blank?
        errors.add(:destination_account, 'should be exist')
        return false
      end
    end
    true
  end

  def email_valid?
    if source_type == 'EMAIL' and email_structure_valid?(source_id) == false
      errors.add(:source_id, 'should base on email format')
      return false
    end

    if destination_type == 'EMAIL' and email_structure_valid?(destination_id) == false
      errors.add(:destination_id, 'should base on email format')
      return false
    end
  end

  def root_uid_valid?
    if source_type == 'VEVENT' or source_type == 'VTODO' or source_type == 'VJOURNAL' or source_type == 'VCARD'
      if source_root_uid.blank?
        errors.add(:source_root_uid, 'should not empty')
        return false
      end
    end

    if destination_type == 'VEVENT' or destination_type == 'VTODO' or destination_type == 'VJOURNAL' or destination_type == 'VCARD'
      if destination_root_uid.blank?
        errors.add(:destination_root_uid, 'should not empty')
        return false
      end
    end
  end

  def link_itself?
    if source_type == destination_type and source_id == destination_id and source_root_uid == destination_root_uid and source_account == destination_account
      errors.add(:source_id, 'can not link with itself')
      return false
    end
  end

  def meta_data_valid?
    meta_data_keys = ['source', 'destination']
    source_destination_keys = ['message_id', 'subject', 'from', 'to',
                               'cc', 'bcc', 'sent_time', 'received_time']

    if meta_data.present?
      begin
        json_meta_data = JSON.parse meta_data
        json_meta_data.keys.each do |key|
          if key == 'source' and source_type != 'EMAIL'
            errors.add(:meta_data, 'invalid')
            return false
          end

          if key == 'destination' and destination_type != 'EMAIL'
            errors.add(:meta_data, 'invalid')
            return false
          end

          unless meta_data_keys.include? key
            errors.add(:meta_data, 'invalid')
            return false
          end

          unless json_meta_data[key].keys.include? 'from'
            errors.add(:meta_data, 'invalid')
            return false
          end

          json_meta_data[key].keys.each do |source_destination_key|
            unless source_destination_keys.include? source_destination_key
              errors.add(:meta_data, 'invalid')
              return false
            end

            if source_destination_key == 'from'
              unless email_format_valid?(json_meta_data[key]['from'])
                errors.add(:meta_data, 'invalid')
                return false
              end
            end

            if source_destination_key == 'to'
              unless list_emails_valid?(json_meta_data[key]['to'])
                errors.add(:meta_data, 'invalid')
                return false
              end
            end

            if source_destination_key == 'cc'
              unless list_emails_valid?(json_meta_data[key]['cc'])
                errors.add(:meta_data, 'invalid')
                return false
              end
            end

            if source_destination_key == 'bcc'
              unless list_emails_valid?(json_meta_data[key]['bcc'])
                errors.add(:meta_data, 'invalid')
                return false
              end
            end

            if source_destination_key == 'sent_time'
              unless json_meta_data[key]['sent_time'].is_a? Numeric
                errors.add(:meta_data, 'invalid')
                return false
              end
            end

            if source_destination_key == 'received_time'
              unless json_meta_data[key]['received_time'].is_a? Numeric
                errors.add(:meta_data, 'invalid')
                return false
              end
            end
          end
        end
      rescue
        errors.add(:meta_data, 'invalid')
        return false
      end
    end
  end

  def exist?
    linked = Link.find_by(source_type: destination_type,
                          source_account: destination_account,
                          source_id: destination_id,
                          source_root_uid: destination_root_uid,
                          destination_type: source_type,
                          destination_account: source_account,
                          destination_id: source_id,
                          destination_root_uid: source_root_uid)
    if linked
      errors.add(:source_id, 'has already been taken')
      return false
    end
  end

  before_create :set_create_time
  before_update :set_update_time
  scope :with_source_or_destination_id, ->(id) { where(source_id: id).or(where(destination_id: id)) }

  def self.obj_is_linked_with_id_not_include_type(id, not_type)
    sql_select = sanitize_sql_array(['CASE WHEN source_id = ? THEN destination_id
            WHEN destination_id = ? THEN source_id END AS obj_id,
            CASE WHEN source_id = ? THEN destination_type
            WHEN destination_id = ? THEN source_type END AS obj_type', id, id, id, id].flatten)
    self.
    select(sql_select).
    where('(source_id = :id and destination_type != :type) or (destination_id = :id and source_type != :type)',
    {
        id: id,
        type: not_type
    })
  end

  scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }

  # Using count for table is load faster but function -> complicate
  # Check on Project
  scope :not_exits_on_projects_source, ->(user_id) {
    select('links.id')
        .where(user_id: user_id, source_type: "FOLDER")
        .where('links.source_account IN ("", 0) or links.destination_account IN ("", 0)')
        .joins("LEFT JOIN projects ON projects.id = links.source_id")
        .where('projects.id is NULL')
  }

  def self.del_not_exits_on_projects_source(user_id)
    sql = Link.not_exits_on_projects_source(user_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  scope :not_exits_on_projects_destination, ->(user_id) {
    select('links.id')
        .where(user_id: user_id, destination_type: "FOLDER")
        .where('links.source_account IN ("", 0) or links.destination_account IN ("", 0)')
        .joins("LEFT JOIN projects ON projects.id = links.destination_id")
        .where('projects.id is NULL')
  }

  def self.del_not_exits_on_projects_destination(user_id)
    sql = Link.not_exits_on_projects_destination(user_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  scope :third_p_not_exits_on_projects_source, ->(user_id, third_party_id) {
    select('links.id')
        .where("links.user_id = :user_id and (source_account = :third_party_id or destination_account = :third_party_id)
             and source_type = :source_type", { user_id: user_id,
                                                third_party_id: third_party_id,
                                                source_type: "FOLDER" })
        .joins("LEFT JOIN projects ON projects.id = links.source_id")
        .where('projects.id is NULL')
  }

  def self.del_third_p_not_exits_on_projects_source(user_id, third_party_id)
    sql = Link.third_p_not_exits_on_projects_source(user_id, third_party_id)
              .to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  scope :third_p_not_exits_on_projects_destination, ->(user_id, third_party_id) {
    select('links.id')
        .where("links.user_id = :user_id and (source_account = :third_party_id or destination_account = :third_party_id)
             and destination_type = :destination_type", { user_id: user_id,
                                                          third_party_id: third_party_id,
                                                          destination_type: "FOLDER" })
        .joins("LEFT JOIN projects ON projects.id = links.destination_id")
        .where('projects.id is NULL')
  }

  def self.del_third_p_not_exits_on_projects_destination(user_id, third_party_id)
    sql = Link.third_p_not_exits_on_projects_destination(user_id, third_party_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end
  # Check on Project

  # Check URLS
  scope :not_exits_on_urls_source, ->(user_id) {
    select('links.id')
        .where(user_id: user_id, source_type: "URL")
        .where('links.source_account IN ("", 0) or links.destination_account IN ("", 0)')
        .joins("LEFT JOIN urls ON urls.id = links.source_id")
        .where('urls.id is NULL')
  }

  def self.del_not_exits_on_urls_source(user_id)
    sql = Link.not_exits_on_urls_source(user_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  scope :not_exits_on_urls_destination, ->(user_id) {
    select('links.id')
        .where(user_id: user_id, destination_type: "URL")
        .where('links.source_account IN ("", 0) or links.destination_account IN ("", 0)')
        .joins("LEFT JOIN urls ON urls.id = links.destination_id")
        .where('urls.id is NULL')
  }

  def self.del_not_exits_on_urls_destination(user_id)
    sql = Link.not_exits_on_urls_destination(user_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  scope :third_p_not_exits_on_urls_source, ->(user_id, third_party_id) {
    select('links.id')
        .where("links.user_id = :user_id and (source_account = :third_party_id or destination_account = :third_party_id)
             and source_type = :source_type", { user_id: user_id,
                                                third_party_id: third_party_id,
                                                source_type: "URL" })
        .joins("LEFT JOIN urls ON urls.id = links.source_id")
        .where('urls.id is NULL')
  }

  def self.del_third_p_not_exits_on_urls_source(user_id, third_party_id)
    sql = Link.third_p_not_exits_on_urls_source(user_id, third_party_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  scope :third_p_not_exits_on_urls_destination, ->(user_id, third_party_id) {
    select('links.id')
        .where("links.user_id = :user_id and (source_account = :third_party_id or destination_account = :third_party_id)
             and destination_type = :destination_type", { user_id: user_id,
                                                          third_party_id: third_party_id,
                                                          destination_type: "URL" })
        .joins("LEFT JOIN urls ON urls.id = links.destination_id")
        .where('urls.id is NULL')
  }

  def self.del_third_p_not_exits_on_urls_destination(user_id, third_party_id)
    sql = Link.third_p_not_exits_on_urls_destination(user_id, third_party_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end
  # Check URLS

  # Check Cards
  scope :not_exits_on_cards_source, ->(user_id) {
    # select('links.id')
    select('links.id, links.source_type, links.source_account, links.source_id, links.source_root_uid')
        .where(user_id: user_id, source_type: "VCARD")
        .where('links.source_account IN ("", 0) or links.destination_account IN ("", 0)')
        .joins("LEFT JOIN cards ON cards.uri = CONCAT(links.source_id, '.vcf')")
        .where('cards.id is NULL')
  }

  def self.del_not_exits_on_cards_source(user_id)
    sql = Link.not_exits_on_cards_source(user_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  scope :not_exits_on_cards_destination, ->(user_id) {
    # select('links.id')
    select('links.id, links.destination_type, links.destination_account, links.destination_id, links.destination_root_uid')
        .where(user_id: user_id, destination_type: "VCARD")
        .where('links.source_account IN ("", 0) or links.destination_account IN ("", 0)')
        .joins("LEFT JOIN cards ON cards.uri = CONCAT(links.destination_id, '.vcf')")
        .where('cards.id is NULL')
  }
  def self.del_not_exits_on_cards_destination(user_id)
    sql = Link.not_exits_on_cards_destination(user_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  def self.del_not_exits_on_cards(user_id, links_ids)
    return if links_ids.blank?
    @links = Link.where("source_id in (?) or destination_id in (?)", links_ids, links_ids)
    @links.each { |x| self.save_delete_item(user_id, API_LINK, x.id) }
    @links.delete_all
  end

  scope :third_p_not_exits_on_cards_source, ->(user_id, third_party_id) {
    # select('links.id')
    select('links.id, links.source_type, links.source_account, links.source_id, links.source_root_uid')
        .where("links.user_id = :user_id and (source_account = :third_party_id or destination_account = :third_party_id)
             and source_type = :source_type", { user_id: user_id,
                                                third_party_id: third_party_id,
                                                source_type: "VCARD" })
        .joins("LEFT JOIN cards ON cards.uri = CONCAT(links.source_id, '.vcf')")
        .where('cards.id is NULL')
  }

  def self.del_third_p_not_exits_on_cards_source(user_id, third_party_id)
    sql = Link.third_p_not_exits_on_cards_source(user_id, third_party_id).to_sql
              .gsub('SELECT links.id, links.source_type, links.source_account, links.source_id, links.source_root_uid', 'DELETE `links`')
    connection.execute(sql)
  end

  scope :third_p_not_exits_on_cards_destination, ->(user_id, third_party_id) {
    # select('links.id')
    select('links.id, links.destination_type, links.destination_account, links.destination_id, links.destination_root_uid')
        .where("links.user_id = :user_id and (source_account = :third_party_id or destination_account = :third_party_id)
             and destination_type = :destination_type", { user_id: user_id,
                                                          third_party_id: third_party_id,
                                                          destination_type: "VCARD" })
        .joins("LEFT JOIN cards ON cards.uri =  CONCAT(links.destination_id, '.vcf')")
        .where('cards.id is NULL')
  }

  def self.del_third_p_not_exits_on_cards_destination(user_id, third_party_id)
    sql = Link.third_p_not_exits_on_cards_destination(user_id, third_party_id).to_sql
              .gsub('SELECT links.id, links.destination_type, links.destination_account, links.destination_id, links.destination_root_uid', 'DELETE `links`')
    connection.execute(sql)
  end
  # Check Cards

  # return model empty
  # @return [Array[Link]] with result empty
  # scope :none, -> {where('false')}

  # Check Event, Todo, Note for FLOL
  #
  # @params user_id [Integer] id user current
  # @params link_type [Array<String>] link_type is 1 in 3 type is [VEVENT, VTODO, VJOURNAL] or 2 in all type or all
  #
  # @returns [Array<Link>] base on *not_exits_on_tbl_calendarobjects_source* or *not_exits_on_tbl_calendarobjects_destination*
  # return nil if do not in 3 type
  def self.not_exits_on_tbl_calendarobjects_source(user_id, link_type)
    all_data = none
    # link_type.each_with_index do |type, index|
    #   if %w(VEVENT VTODO VJOURNAL).include?(type)
    #     all_data += select('links.id')
    #                     .where(user_id: user_id, source_type: type)
    #                     .where('links.source_account IN ("", 0) or links.destination_account IN ("", 0)')
    #                     .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.source_id")
    #                     .where('calendarobjects.id is NULL')
    #     # pp all_data
    #   else
    #     return none
    #   end
    # end
    if %w(VEVENT VTODO VJOURNAL).to_set.superset?(link_type.to_set)
      all_data = select('links.id')
                      .where(user_id: user_id, source_type: link_type)
                      .where('links.source_account IN ("", 0)')
                      .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.source_id")
                      .where('calendarobjects.id is NULL')
      # pp all_data
    end
    all_data
  end

  # def self.del_not_exits_on_tbl_calendarobjects_source(user_id, link_type)
    # sql = Link.not_exits_on_tbl_calendarobjects_source(user_id, link_type)
              # .to_sql.gsub('SELECT links.id', 'DELETE `links`')
    # connection.execute(sql)
  # end

  def self.not_exits_on_tbl_calendarobjects_FLOL_FLOL(user_id, link_type)
    all_data = none
    if %w(VEVENT VTODO VJOURNAL).to_set.superset?(link_type.to_set)
      not_exits_on_tbl_calendarobjects_source_FLOL = select('links.id')
                                                    .where(user_id: user_id, source_type: link_type)
                                                    .where('links.source_account IN ("", 0) and links.destination_account IN ("", 0)')
                                                    .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.source_id")
                                                    .where('calendarobjects.id is NULL')

      not_exits_on_tbl_calendarobjects_destination_FLOL = select('links.id')
                                                    .where(user_id: user_id, destination_type: link_type)
                                                    .where('links.source_account IN ("", 0) and links.destination_account IN ("", 0)')
                                                    .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.destination_id")
                                                    .where('calendarobjects.id is NULL')
      all_data = Link.from("(#{not_exits_on_tbl_calendarobjects_source_FLOL.to_sql} UNION
         #{not_exits_on_tbl_calendarobjects_destination_FLOL.to_sql}) AS links")
      # pp all_data
    end
    all_data
  end

  def self.not_exits_on_tbl_calendarobjects_FLOL_3rd(user_id, link_type)
    all_data = none
    if %w(VEVENT VTODO VJOURNAL).to_set.superset?(link_type.to_set) #
      flo_3rd_join_source = select('links.id, links.destination_type, links.destination_account, links.destination_id, links.destination_root_uid')
                     .where(user_id: user_id)
                     .where('links.source_account IN ("", 0) and links.destination_account != "" and '\
                              '(
                                (links.source_type = :link_type and links.destination_type in ("VEVENT", "VTODO", "VJOURNAL")) or
                                (links.source_type in ("VEVENT", "VTODO", "VJOURNAL") and links.destination_type = :link_type)
                              )',
                            {:link_type => link_type})
                     .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.source_id")
                     .where('calendarobjects.id is NULL')
      flo_3rd_join_destination = select('links.id, links.destination_type, links.destination_account, links.destination_id, links.destination_root_uid')
                      .where(user_id: user_id)
                      .where('links.source_account IN ("", 0) and links.destination_account != "" and '\
                              '(
                                (links.source_type = :link_type and links.destination_type in ("VEVENT", "VTODO", "VJOURNAL")) or
                                (links.source_type in ("VEVENT", "VTODO", "VJOURNAL") and links.destination_type = :link_type)
                              )',
                             {:link_type => link_type})
                      .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.destination_id")
                      .where('calendarobjects.id is NULL')
      all_data = Link.from("(#{flo_3rd_join_source.to_sql} UNION
         #{flo_3rd_join_destination.to_sql}) AS links")
    end
    all_data
  end

  # (see self#not_exits_on_tbl_calendarobjects_source)
  def self.not_exits_on_tbl_calendarobjects_destination(user_id, link_type)
    # link_type.each do |type|
    #   if %w(VEVENT, VTODO, VJOURNAL).include?(type)
    #     return nil
    #   end
    # end
    #
    # all_data = nil
    # link_type.each do |type|
    #   if %w(VEVENT, VTODO, VJOURNAL).include?(type)
    #     all_data = all_data & select('links.id')
    #                     .where(user_id: user_id, destination_type: type)
    #                     .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.source_id")
    #                     .where('calendarobjects.id is NULL')
    #   end
    # end
    # return all_data

    # all_data = none
    # link_type.each_with_index do |type, index|
    #   if %w(VEVENT VTODO VJOURNAL).include?(type)
    #     all_data = select('links.id')
    #                     .where(user_id: user_id, destination_type: type)
    #                     .where('links.source_account IN ("", 0) or links.destination_account IN ("", 0)')
    #                     .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.destination_id")
    #                     .where('calendarobjects.id is NULL')
    #     # pp all_data
    #   else
    #     return none
    #   end
    # end
    if %w(VEVENT VTODO VJOURNAL).to_set.superset?(link_type.to_set)
      all_data = select('links.id')
                     .where(user_id: user_id, destination_type: link_type)
                     .where('links.destination_account IN ("", 0)')
                     .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.destination_id")
                     .where('calendarobjects.id is NULL')
    end
    return all_data
  end

  # def self.del_not_exits_on_tbl_calendarobjects_destination(user_id, link_type)
    # sql = Link.not_exits_on_tbl_calendarobjects_destination(user_id, link_type)
              # .to_sql.gsub('SELECT links.id', 'DELETE `links`')
    # connection.execute(sql)
  # end

  def self.not_exits_on_tbl_calendarobjects_3rd_FLOL(user_id, link_type)
    all_data = none
    if %w(VEVENT VTODO VJOURNAL).to_set.superset?(link_type.to_set)
      s3rd_flol_join_source = select('links.id, links.source_type, links.source_account, links.source_id, links.source_root_uid')
                     .where(user_id: user_id)
                     .where('links.source_account != "" and links.destination_account IN ("", 0) and '\
                              '(
                                (links.source_type = :link_type and links.destination_type in ("VEVENT", "VTODO", "VJOURNAL")) or
                                (links.source_type in ("VEVENT", "VTODO", "VJOURNAL") and links.destination_type = :link_type)
                              )',
                            {:link_type => link_type})
                     .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.source_id")
                     .where('calendarobjects.id is NULL')
      s3rd_flol_join_destination = select('links.id, links.source_type, links.source_account, links.source_id, links.source_root_uid')
                     .where(user_id: user_id)
                     .where('links.source_account != "" and links.destination_account IN ("", 0) and '\
                              '(
                                (links.source_type = :link_type and links.destination_type in ("VEVENT", "VTODO", "VJOURNAL")) or
                                (links.source_type in ("VEVENT", "VTODO", "VJOURNAL") and links.destination_type = :link_type)
                              )',
                            {:link_type => link_type})
                     .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.destination_id")
                     .where('calendarobjects.id is NULL')
      all_data = Link.from("(#{s3rd_flol_join_source.to_sql} UNION
         #{s3rd_flol_join_destination.to_sql}) AS links")
      # pp all_data
    end
    all_data
  end

  def self.get_sorted_calobj_links_from_folder(user_id, folder_id, item_type, sort_type = 'date')
    if sort_type == 'alphabetical'
      order_by = 'case
                  when INSTR(calendardata, "\nSUMMARY:")
                  then substring(calendardata, INSTR(calendardata, "\nSUMMARY:")+9, 
                          INSTR(substring(calendardata, INSTR(calendardata, "\nSUMMARY:")+9), "\n")) 
                  end'
    elsif item_type == 'VTODO' and sort_type == 'manual'
      order_by = 'd.order_number'
    elsif item_type == 'VEVENT'
      order_by = 'c.firstoccurence desc'
    else
      order_by = 'c.lastmodified desc'
    end

    sql = <<-SQL
      select l.id,
        case 
          when l.source_type = 'FOLDER'
          then l.destination_type
          when l.destination_type = 'FOLDER'
          then l.source_type
        end as item_type,
        case 
          when l.source_type = 'FOLDER'
          then l.destination_id
          when l.destination_type = 'FOLDER'
          then l.source_id
        end as item_uid,
        case 
          when l.source_type = 'FOLDER'
          then l.destination_account
          when l.destination_type = 'FOLDER'
          then l.source_account
        end as item_account,
        case 
          when l.source_type = 'FOLDER'
          then l.destination_root_uid
          when l.destination_type = 'FOLDER'
          then l.source_root_uid
        end as item_root_uid
      from links as l
      left join calendarobjects as c on c.uid = case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end
      left join trash as t on t.obj_id = case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end
      where l.user_id = :user_id and ((l.source_type = :item_type and
                l.destination_type = 'FOLDER' and l.destination_id = :folder_id) or
                (l.destination_type = :item_type and
                  l.source_type = 'FOLDER' and l.source_id = :folder_id)) 
                  and (t.obj_id is null) order by #{order_by}
    SQL
    if item_type == 'VTODO'
      sql = <<-SQL
        select l.id,
          case 
            when l.source_type = 'FOLDER'
            then l.destination_type
            when l.destination_type = 'FOLDER'
            then l.source_type
          end as item_type,
          case 
            when l.source_type = 'FOLDER'
            then l.destination_id
            when l.destination_type = 'FOLDER'
            then l.source_id
          end as item_uid,
          case 
            when l.source_type = 'FOLDER'
            then l.destination_account
            when l.destination_type = 'FOLDER'
            then l.source_account
          end as item_account,
          case 
            when l.source_type = 'FOLDER'
            then l.destination_root_uid
            when l.destination_type = 'FOLDER'
            then l.source_root_uid
          end as item_root_uid
        from links as l
        left join calendarobjects as c on c.uid = case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end
        left join trash as t on t.obj_id = case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end
        left join obj_order as d on d.obj_id = case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end
        where l.user_id = :user_id and ((l.source_type = :item_type and
                  l.destination_type = 'FOLDER' and l.destination_id = :folder_id) or
                  (l.destination_type = :item_type and
                    l.source_type = 'FOLDER' and l.source_id = :folder_id)) 
                    and (t.obj_id is null) order by #{order_by}
      SQL
    end

    find_by_sql([sql, {:user_id => user_id, :item_type => item_type, :folder_id => folder_id }])
  end

  def self.get_sorted_cardobj_links_from_folder(user_id, folder_id, sort_type = 'date')
    if sort_type == 'alphabetical'
      order_by = 
        'case 
          when INSTR(carddata, "\nN:")
            then substring(carddata, INSTR(carddata, "\nN:")+3, INSTR(substring(carddata, INSTR(carddata, "\nN:")+3), "\n"))
          when INSTR(carddata, "\nFN:")
            then substring(carddata, INSTR(carddata, "\nFN:")+4, INSTR(substring(carddata, INSTR(carddata, "\nFN:")+4), "\n"))
        end'
    else
      order_by = 'cards.lastmodified desc'
    end

    sql = <<-SQL
      select l.id,
        case 
          when l.source_type = 'FOLDER'
          then l.destination_type
          when l.destination_type = 'FOLDER'
          then l.source_type
        end as item_type,
          case 
          when l.source_type = 'FOLDER'
          then l.destination_id
          when l.destination_type = 'FOLDER'
          then l.source_id
        end as item_uid,
          case 
          when l.source_type = 'FOLDER'
          then l.destination_account
          when l.destination_type = 'FOLDER'
          then l.source_account
        end as item_account,
          case 
          when l.source_type = 'FOLDER'
          then l.destination_root_uid
          when l.destination_type = 'FOLDER'
          then l.source_root_uid
        end as item_root_uid
      from links as l
      left join cards on cards.uri = concat(case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end, ".vcf")
      left join trash as t on t.obj_id = case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end
      where l.user_id = :user_id and ((l.source_type = :item_type and
                l.destination_type = 'FOLDER' and l.destination_id = :folder_id) or
                (l.destination_type = :item_type and
                  l.source_type = 'FOLDER' and l.source_id = :folder_id)) 
                  and (t.obj_id is null) order by #{order_by}
    SQL

    find_by_sql([sql, {:user_id => user_id, :item_type => 'VCARD', :folder_id => folder_id}])
  end

  def self.get_sorted_url_links_from_folder(user_id, folder_id, sort_type = 'date')
    if sort_type == 'alphabetical'
      order_by = 'urls.title'
    else
      order_by = 'urls.created_date desc'
    end

    sql = <<-SQL 
      select l.id,
        case 
          when l.source_type = 'FOLDER'
          then l.destination_type
          when l.destination_type = 'FOLDER'
          then l.source_type
        end as item_type,
          case 
          when l.source_type = 'FOLDER'
          then l.destination_id
          when l.destination_type = 'FOLDER'
          then l.source_id
        end as item_uid,
          case 
          when l.source_type = 'FOLDER'
          then l.destination_account
          when l.destination_type = 'FOLDER'
          then l.source_account
        end as item_account,
          case 
          when l.source_type = 'FOLDER'
          then l.destination_root_uid
          when l.destination_type = 'FOLDER'
          then l.source_root_uid
        end as item_root_uid
      from links as l
      left join urls on urls.id = case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end
      left join trash as t on t.obj_id = case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end
      where l.user_id = :user_id and ((l.source_type = :item_type and
                l.destination_type = 'FOLDER' and l.destination_id = :folder_id) or
                (l.destination_type = :item_type and
                  l.source_type = 'FOLDER' and l.source_id = :folder_id)) 
                  and (t.obj_id is null) order by #{order_by}
    SQL

    find_by_sql([sql, {:user_id => user_id, :item_type => 'URL', :folder_id => folder_id}])
  end

  def self.get_email_links_from_folder(user_id, folder_id)
    sql = <<-SQL 
      select l.id,
        case 
          when l.source_type = 'FOLDER'
          then l.destination_type
          when l.destination_type = 'FOLDER'
          then l.source_type
        end as item_type,
          case 
          when l.source_type = 'FOLDER'
          then l.destination_id
          when l.destination_type = 'FOLDER'
          then l.source_id
        end as item_uid,
          case 
          when l.source_type = 'FOLDER'
          then l.destination_account
          when l.destination_type = 'FOLDER'
          then l.source_account
        end as item_account,
          case 
          when l.source_type = 'FOLDER'
          then l.destination_root_uid
          when l.destination_type = 'FOLDER'
          then l.source_root_uid
        end as item_root_uid
      from links as l
      left join trash as t on t.obj_id = case when l.source_type = 'FOLDER' then l.destination_id when l.destination_type = 'FOLDER' then l.source_id end
      where l.user_id = :user_id and ((l.source_type = :item_type and
                l.destination_type = 'FOLDER' and l.destination_id = :folder_id) or
                (l.destination_type = :item_type and
                  l.source_type = 'FOLDER' and l.source_id = :folder_id)) 
                  and (t.obj_id is null)
    SQL

    find_by_sql([sql, {:user_id => user_id, :item_type => 'EMAIL', :folder_id => folder_id}])
  end

  # Check Event, Todo, Note for third Party on source
  #
  # @params user_id [Integer] id user current
  # @params link_type [Array<String>] link_type is 1 in 3 type is [VEVENT, VTODO, VJOURNAL] or 2 in all type or all
  # @params third_party_id [Integer] id of third party
  #
  # @returns [Array[Link]] Base on *not_exits_on_tbl_calendarobjects_source* or *not_exits_on_tbl_calendarobjects_destination*
  # return nil if do not in 3 type
  def self.third_p_not_exits_on_tbl_calendarobjects_source(user_id, link_type, third_party_id)
    all_data = none
    # link_type.each do |type|
    #   if %w(VEVENT VTODO VJOURNAL).include?(type)
    #     all_data += select('links.id')
    #                     .where(
    #                         "links.user_id = :user_id and (source_account = :third_party_id or destination_account = :third_party_id)
    #                         and source_type = :source_type",
    #                         {
    #                             user_id: user_id,
    #                             third_party_id: third_party_id,
    #                             source_type: type
    #                         }
    #                     )
    #                     .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.source_id")
    #                     .where('calendarobjects.id is NULL')
    #     # pp all_data
    #   else
    #     return none
    #   end
    # end
    if %w(VEVENT VTODO VJOURNAL).to_set.superset?(link_type.to_set)
      all_data = select('links.id, links.source_type, links.source_account, links.source_id, links.source_root_uid')
                      .where("links.user_id = :user_id and source_account = :third_party_id", { user_id: user_id,
                                                                                                third_party_id: third_party_id })
                      .where({source_type: link_type})
                      .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.source_id")
                      .where('calendarobjects.id is NULL')
      # pp all_data
    end
    all_data
  end

  def self.del_third_p_not_exits_on_tbl_calendarobjects_source(user_id, link_type, third_party_id)
    sql = Link.third_p_not_exits_on_tbl_calendarobjects_source(user_id, link_type, third_party_id)
              .to_sql.gsub('SELECT links.id, links.source_type, links.source_account, links.source_id, links.source_root_uid', 'DELETE `links`')
    connection.execute(sql)
  end

  # (see self#third_p_not_exits_on_tbl_calendarobjects_source)
  def self.third_p_not_exits_on_tbl_calendarobjects_destination(user_id, link_type, third_party_id)
    all_data = none
    # link_type.each do |type|
    #   if %w(VEVENT VTODO VJOURNAL).include?(type)
    #     all_data += select('links.id')
    #                     .where(
    #                         "links.user_id = :user_id and (source_account = :third_party_id or destination_account = :third_party_id)
    #                         and destination_type = :destination_type",
    #                         {
    #                             user_id: user_id,
    #                             third_party_id: third_party_id,
    #                             destination_type: type
    #                         }
    #                     )
    #                     .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.destination_id")
    #                     .where('calendarobjects.id is NULL')
    #     # pp all_data
    #   else
    #     return none
    #   end
    # end
    if %w(VEVENT VTODO VJOURNAL).to_set.superset?(link_type.to_set)
      all_data = select('links.id, links.destination_type, links.destination_account, links.destination_id, links.destination_root_uid')
                      .where( "links.user_id = :user_id and destination_account = :third_party_id", { user_id: user_id,
                                                                                                      third_party_id: third_party_id })
                      .where({destination_type: link_type})
                      .joins("LEFT JOIN calendarobjects ON calendarobjects.uid = links.destination_id")
                      .where('calendarobjects.id is NULL')
      # pp all_data
    end

    return all_data
  end

  def self.del_third_p_not_exits_on_tbl_calendarobjects_destination(user_id, link_type, third_party_id)
    sql = Link.third_p_not_exits_on_tbl_calendarobjects_destination(user_id, link_type, third_party_id)
              .to_sql.gsub('SELECT links.id, links.destination_type, links.destination_account, links.destination_id, links.destination_root_uid', 'DELETE `links`')
    connection.execute(sql)
  end

  def self.not_exits_on_email_source(user_id, cols = "id, source_type, source_account,
    source_id, destination_id, source_root_uid, destination_root_uid")
    sql = <<-SQL
      SELECT  #{cols}
      FROM links
      Where user_id = :user_id and source_type = "EMAIL"
      and (source_account IN ("", 0) or destination_account IN ("", 0));
    SQL
    find_by_sql [sql, {user_id: user_id}]
  end

  def self.del_not_exits_on_email_source(user_id, cols)
    sql = Link.not_exits_on_email_source(user_id, cols).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  def self.not_exits_on_email_destination(user_id, cols = "id, source_type, source_account,
    source_id, destination_id, source_root_uid, destination_root_uid")
    sql = <<-SQL
      SELECT #{cols}
      FROM links
      Where user_id = :user_id and destination_type = "EMAIL"
      and (source_account IN ("", 0) or destination_account IN ("", 0));
    SQL
    find_by_sql [sql, {user_id: user_id}]
  end

  def self.del_not_exits_on_email_destination(user_id, cols)
    sql = Link.not_exits_on_email_destination(user_id, cols).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  def self.third_p_not_exits_on_email(user_id, third_party_id)
    sql = <<-SQL
      SELECT id, source_type, destination_type, source_account, destination_account,
      source_id, destination_id, source_root_uid, destination_root_uid
      FROM links
      Where user_id = :user_id and (source_type = "EMAIL" or destination_type = "EMAIL")
      and (source_account = :third_party_id or destination_account = :third_party_id);
    SQL
    find_by_sql [sql, {
        user_id: user_id,
        third_party_id: third_party_id
    }]
  end

  def self.del_third_p_not_exits_on_email(user_id, third_party_id)
    sql = Link.third_p_not_exits_on_email(user_id, third_party_id).to_sql.gsub('SELECT links.id', 'DELETE `links`')
    connection.execute(sql)
  end

  def self.delete_dup(user_id)
    sql = <<-SQL
        delete n1
        FROM `links` as n1, `links` as n2
        WHERE
        n1.user_id = #{user_id} AND
        n1.id < n2.id AND
        n1.source_id = n2.source_id AND
        n1.destination_id = n2.destination_id AND
        n1.user_id = n2.user_id AND
        n1.source_type = n2.source_type AND
        n1.destination_type = n2.destination_type
    SQL
    connection.execute(sql)
  end

  def self.delete_all_links(user_id, ids)
    return if ids.blank?
    @links = Link.where(user_id: user_id, id: ids.split(','))
    @links.each { |x| self.save_delete_item(user_id, API_LINK, x.id) }
    @links.delete_all
  end

  # get all links by 3rd party accounts
  def self.get_links_by_3rd_accounts(user_id, ids_3rdAcc)
    sql = "SELECT * FROM links as lk
           WHERE lk.user_id = :user_id
            AND (
              (lk.source_account  IN (:ids_3rdAcc)
              OR
              (lk.destination_account  IN (:ids_3rdAcc) )
            )"
    find_by_sql([sql, { user_id: user_id, ids_3rdAcc: ids_3rdAcc }])
    # Maybe this function isn't used
    # links = Link.arel_table
    # clause_1 = links[:user_id].eq(user_id).and(links[:source_account].in(ids_3rdAcc))
    # clause_2 = links[:user_id].eq(user_id).and(links[:destination_account].in(ids_3rdAcc))
    # where(clause_1.or(clause_2))
  end

  # get all links of Flo account
  # def self.get_links_by_flo_accounts(user_id, ids_3rd)
    # sql = ""
    # find_by_sql(sql)
  # end

  def self.folder_links(user_id, obj_ids, has_trash = false)
    sql = ''
    if has_trash
      sql = "SELECT id, destination_id, source_id, source_account,
            destination_account,source_type, destination_type
            FROM links
            WHERE user_id = :user_id
            AND ((destination_type = 'FOLDER' AND source_id in (:obj_ids))
            OR (source_type = 'FOLDER' AND destination_id in (:obj_ids)))"
    else
      sql = "SELECT links.id, destination_id, source_id, source_account,
            destination_account,source_type, destination_type
            FROM links left join trash on links.destination_id = trash.obj_id
            WHERE links.user_id = :user_id
            AND (destination_type = 'FOLDER' AND source_id in (:obj_ids))
            AND trash.obj_id IS NULL
            union (
            SELECT links.id, destination_id, source_id, source_account,
            destination_account,source_type, destination_type
            FROM links left join trash on links.source_id = trash.obj_id
            WHERE links.user_id = :user_id
            AND (source_type = 'FOLDER' AND destination_id in (:obj_ids))
            AND trash.obj_id IS NULL)"
    end

    find_by_sql([sql, {user_id: user_id, obj_ids: obj_ids}])
  end

  #get all items by folder id (collection id) to show in canvas
  def self.get_links_by_obj(user_id, obj_type, obj_id)
    sql = ' SELECT * FROM links '
    sql << ' WHERE user_id = :user_id AND source_type = :obj_type AND source_id = :obj_id '

    sql << ' UNION '

    sql << ' SELECT * FROM links '
    sql << ' WHERE user_id = :user_id AND destination_type = :obj_type AND destination_id = :obj_id '
    find_by_sql([sql, {user_id: user_id, obj_type: obj_type, obj_id: obj_id}])
  end

  #get all items by user_id
  def self.get_links_by_userid(user_id)
    sql = %|SELECT * FROM links WHERE user_id = :user_id|
    find_by_sql([sql, {user_id: user_id}])
  end

  # #convert string
  # def self.process_string_b64(str_b64)
  #   # decode base64
  #   # unable to search this link after creating
  #   # begin
  #   decoded = Base64.decode64(str_b64).force_encoding("UTF-8")
  #   obj = JSON.parse(decoded.to_s)
  #   # obj = decoded.to_json
  #   res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title'].force_encoding("UTF-8")}
  #   puts '==========='
  #   puts res
  #   #endcode base64
  #   s = Base64.strict_encode64(res.to_json)
  #   puts s
  #   return s # Uncomment because puts above error when drag to kanban
  #   # rescue
  #   #  return str_b64
  #   # end
  # end

  # check link exist or not to show link icon in item
  def self.count_link_by_uid(uid)
    begin
      decoded = Base64.decode64(uid).force_encoding("UTF-8")
      obj = JSON.parse(decoded) if decoded.present?
      if obj and obj['path'].present?
        res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
        uid = Base64.strict_encode64(res.to_json)
      end
    rescue
    ensure
      sql = %|SELECT COUNT(DISTINCT id) AS 'number_of_links'
              FROM links
              WHERE (source_id like ? OR destination_id like ?)
              AND (source_type != "FOLDER" and destination_type != "FOLDER")|
      result = find_by_sql([sql, uid, uid])
    end
    result.first["number_of_links"] if result.present?
  end

  def self.count_link_by_uids(uids, user_id, has_trash = false)
    uids_formatted = []
    begin
      uids.each do |uid|
        begin
          decoded = Base64.decode64(uid).force_encoding("UTF-8")
          obj = JSON.parse(decoded) if decoded.present?
          if obj and obj['path'].present?
            res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title']}
            uid = Base64.strict_encode64(res.to_json)
          end
        rescue
        ensure
          uids_formatted.push(uid)
        end
      end
    rescue
    ensure
      sql = has_trash ?
          %|select source_id as uid, COUNT(*) as link_count from links where source_type != "FOLDER" and
              destination_type != "FOLDER" AND user_id=? and source_id in (?) group by source_id
              union
              (select destination_id as uid, COUNT(*) as link_count from links where source_type != "FOLDER" and
              destination_type != "FOLDER" AND user_id=? and destination_id in (?) group by destination_id)| :
          %|select source_id as uid, COUNT(links.source_id) as link_count from links
              left join trash on links.destination_id = trash.obj_id
              where source_type != "FOLDER" and destination_type != "FOLDER" AND
              links.user_id=? and source_id in (?)
              and trash.obj_id IS NULL
              group by source_id
              union
              (select destination_id as uid, COUNT(links.destination_id) as link_count from links
              left join trash on links.source_id = trash.obj_id
              where source_type != "FOLDER" and destination_type != "FOLDER" AND
              links.user_id=? and destination_id in (?)
              and trash.obj_id IS NULL
              group by destination_id)|
      # don't count links.id on join because its 2 table have attribute id
      result = find_by_sql([sql, user_id, uids_formatted, user_id, uids_formatted])
    end
    result
  end


  # check link of Flol
  # def self.link_of_flol()
  #   sql = %|SELECT
  #           FROM links
  #           WHERE (source_id like ? OR destination_id like ?)
  #           AND (source_type != "FOLDER" and destination_type != "FOLDER")|
  #   result = find_by_sql([sql, uid, uid])
  #   result.first["number_of_links"]
  # end

  private

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
    #check source type or destination type is EMAIL
    #convert right format json
    #for source ID
    # if self.source_type and self.source_id and self.source_id.to_s.strip.length > 0 and
        # self.source_type.to_s.upcase.strip == API_EMAIL # of if above
      # self.source_id = EncodeDecodeBase64.process_string_b64_from_ascii_to_utf8(self.source_id)
    # end
    #for detination ID
    # if self.destination_type and self.destination_id and self.destination_id.to_s.strip.length > 0 and
        # self.destination_type.to_s.upcase.strip == API_EMAIL # of if above
      # self.destination_id = EncodeDecodeBase64.process_string_b64_from_ascii_to_utf8(self.destination_id)
    # end
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
    #check source type or destination type is EMAIL
    #convert right format json
    #for source ID
    # if self.source_type.to_s.upcase.strip.include?(API_EMAIL) and self.source_id and self.source_id.to_s.strip.length > 0 and
        # self.source_type.to_s.upcase.strip == API_EMAIL
      # self.source_id = EncodeDecodeBase64.process_string_b64_from_ascii_to_utf8(self.source_id)
    # end
    #for detination ID
    # if self.destination_type.to_s.upcase.strip.include?(API_EMAIL) and self.destination_id and self.destination_id.to_s.strip.length > 0 and
        # self.destination_type.to_s.upcase.strip == API_EMAIL
      # self.destination_id = EncodeDecodeBase64.process_string_b64_from_ascii_to_utf8(self.destination_id)
    # end
  end

  def email_structure_valid?(base64_str)
    decoded = Base64.strict_decode64(base64_str).force_encoding("utf-8")
    json_email = JSON.parse(decoded.to_s)
  
    unless json_email['uid'].is_a?(Numeric)
      return false
    end

    return (json_email['uid'].present? and json_email['path'].present? and json_email['title'].present?)
  rescue
    false
  end

  def email_format_valid?(email)
    if email[EMAIL_PATTERN, 1].blank?
      return false
    end
    true
  end

  def list_emails_valid?(email_arr)
    if email_arr.present?
      email_arr.each do |email|
        unless email_format_valid?(email)
          return false
        end
      end
    end
    true
  end
end
