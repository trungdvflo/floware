module CommonScopes
  extend ActiveSupport::Concern

  # rubocop:disable Metrics/BlockLength
  included do
    scope :with_modifiedGTE, lambda { |date|
      where('updated_date >= ?', date) if date.present?
    }

    scope :with_modifiedLT, lambda { |date|
      where('updated_date < ?', date) if date.present?
    }

    scope :with_ids, lambda { |ids|
      where(id: ids.split(',')) if ids.present?
    }

    scope :with_min_id, lambda { |min_id|
      where('id > ?', min_id.to_i) if min_id.present?
    }

    scope :with_p_item, lambda { |p_item|
      order(:id).limit(p_item.to_i) if p_item.to_i > 0
    }

    scope :with_fields, lambda { |fields|
      return if fields.blank?
      arr_fields = fields.split(',')
      valid_fields = []
      arr_fields.each do |field|
        valid_fields << field if column_names.include? field
      end

      valid_fields << 'user_id' if column_names.include? 'user_id'
      select(valid_fields)
    }

    scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }
  end
  # rubocop:enable Metrics/BlockLength
end
