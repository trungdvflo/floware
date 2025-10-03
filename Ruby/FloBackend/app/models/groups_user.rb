class GroupsUser < ApplicationRecord
  before_create :set_create_time
  before_update :set_update_time

  belongs_to :user
  belongs_to :group

  validates :user_id, presence: true, uniqueness: { scope: :group_id }
  validates :group_id, presence: true

  def self.add_users_to_groups(group_ids, user_emails)
    group_ids.each do |group_id|
      group = Group.find group_id.to_i

      user_emails.each do |user_email|
        user = User.where(email: user_email).first
        next unless user
        create(group: group, user: user)
      end
    end
  rescue => e
    raise 'Error while adding users. ' + e.message
  end

  private

  def set_create_time
    self.created_date = Time.zone.now.to_i
    self.updated_date = Time.zone.now.to_i
  end

  def set_update_time
    self.updated_date = Time.zone.now.to_i
  end
end
