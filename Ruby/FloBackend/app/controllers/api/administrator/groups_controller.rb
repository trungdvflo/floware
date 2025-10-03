class Api::Administrator::GroupsController < Api::Administrator::BaseController
  before_action :set_group, only: [:update, :destroy, :remove_users, :users, :show]

  def index
    pNumber = params[:page]
    pItem = params[:per_page]
    
    @paginator= {
      :page => pNumber,
      :per_page => pItem
    }
    
    @count = Group.count
   
    # no_group = { id: 0, name: "No Group" }

    # groups_users = GroupsUser.arel_table
    # users = User.arel_table

    # user_ids_have_groups = groups_users.project(groups_users[:user_id])
    # User.where(users[:id].not_in(user_ids_have_groups))

    # @groups = Group.paginate(page: paginator[:page], per_page: paginator[:per_page])
    #                .joins('LEFT JOIN groups_users on groups_users.group_id = groups.id')
    #                .select('groups.id, name, count(groups_users.user_id) as number_users, description')
    #                .group('groups.id')
    
    #cong.tran
    @groups = Group.get_groups(pNumber, pItem)
  end

  def create
    @group = Group.create!(name: params[:name], description: params[:description])
  end

  def update
    @group.update_attributes!(name: params[:name], description: params[:description])
  end

  def destroy
    @group.destroy
  end

  def show; end

  # def users
  #   @users = @group.users.paginate(page: paginator[:page], per_page: paginator[:per_page]).to_a
  #   @count = @group.users.size
  # end

  def add_users
    return if params[:user_emails].present? == false or params[:group_ids].to_i == 0
    @message = { message: 'Add successfully' }

    group_ids = params[:group_ids].split(',')
    user_emails = params[:user_emails].split(',')

    GroupsUser.add_users_to_groups(group_ids, user_emails)
  rescue => e
    @message = { message: 'Add failed', errors: e.message }
  end

  def remove_users
    return unless params[:user_emails]
    @message = { message: 'Remove successfully' }
    user_emails = params[:user_emails].split(',').map(&:strip)

    user_ids = User.where(email: user_emails).select('id')

    GroupsUser.where(group_id: @group.id, user_id: user_ids).delete_all
  rescue => e
    @message = { message: 'Remove failed', errors: e.message }
  end

  private

  def set_group
    @group = Group.find params[:id].to_i
  end
end
