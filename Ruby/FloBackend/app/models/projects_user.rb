class ProjectsUser < ApplicationRecord
  STATUS_PENDING = 0
  STATUS_ACCEPTED = 1
  PERMISION_READ_WRITE = 0

  belongs_to :project
  belongs_to :user

  validates :project, presence: true, uniqueness: { scope: :user_id }
  validates :user, presence: true, uniqueness: { scope: :project_id }

  after_initialize :status_pending, :full_permission, :created_time, if: :new_record?
  before_save :update_time, unless: :new_record?

  def accepted?
    self.status = STATUS_ACCEPTED
    save
  end

  private

  def status_pending
    self.status = STATUS_PENDING
  end

  def full_permission
    self.permission = PERMISION_READ_WRITE
  end

  def created_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
