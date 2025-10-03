class ProjectPolicy < ApplicationPolicy
  def owner?
    user.id == record.user_id
  end

  def owner_or_member?
    owner? || member?
  end

  def member?
    ProjectsUser.find_by(project_id: record.id,
                         user_id: user.id,
                         status: ProjectsUser::STATUS_ACCEPTED,
                         permission: ProjectsUser::PERMISION_READ_WRITE)
                .present?
  end

  def invited?
    ProjectsUser.find_by(project_id: record.id,
                         user_id: user.id,
                         permission: ProjectsUser::PERMISION_READ_WRITE)
                .present?
  end
end
