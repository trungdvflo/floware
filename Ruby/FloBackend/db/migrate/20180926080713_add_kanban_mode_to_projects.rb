class AddKanbanModeToProjects < ActiveRecord::Migration[5.0]
  def change
    unless column_exists? :projects, :kanban_mode
      add_column :projects, :kanban_mode, :integer
    end
  end
end
