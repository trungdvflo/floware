class ProjectsCard < ActiveRecord::Base
  belongs_to :project
  belongs_to :set_account

  before_create :create_time
  before_update :update_time

  validates :project_id, presence: true, uniqueness: { scope: [:card_uid, :href] }
  validates :card_uid, presence: true
  validates :href, presence: true

  def create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def update_time
    self.updated_date = Time.now.utc.to_f.round(3)
    self.recent_time = Time.now.utc.to_f.round(3)
  end
end
