class RecentObject < ApplicationRecord
  # LIMIT_RECENT_OBJECT = 80

  before_create :set_create_time
  before_update :set_update_time
  # after_create :limit_recent_objects

  belongs_to :user

  validates :uid, presence: true
  validates :uid, uniqueness: true

  scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }

  scope :with_ids, lambda { |ids|
    where(id: ids.split(',')) if ids.present?
  }

  scope :with_min_id, lambda { |min_id|
    order(:id).where('id > ?', min_id.to_i) if min_id.to_i > 0
  }

  scope :with_p_item, lambda { |p_item|
    limit(p_item.to_i) if p_item.to_i > 0
  }

  scope :with_p_number, lambda { |p_number, p_item|
    total_page = p_number.to_i * p_item.to_i
    offset(total_page - p_item.to_i) if p_number.to_i > 0 and p_item.to_i > 0
  }

  scope :with_dav_type, lambda { |dav_type|
    where('dav_type = ?', dav_type) if dav_type.present?
  }

  scope :with_uids, lambda { |uids|
    where(uid: uids.split(',')) if uids.present?
  }

  class << self
    def create_or_update(create_params)
      recent_object = RecentObject.where(uid: create_params[:uid]).first
      if recent_object
        recent_object.save
      else
        recent_object = RecentObject.create(create_params)
      end
      recent_object
    end
  end

  private

  # def limit_recent_objects
  #   current_recent_objects = RecentObject.where(user_id: user_id)
  #   current_recent_objects.first.destroy if current_recent_objects.size > LIMIT_RECENT_OBJECT
  # end

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
