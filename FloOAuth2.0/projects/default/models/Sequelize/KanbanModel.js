
const config = {
  tableName: 'kanban',
  model: 'KanbanModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    return sequelize.define(config.model, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        required: true
      },
      collection_id: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },

      name: {
        type: DataTypes.STRING,
        required: true
      },

      color: {
        type: DataTypes.STRING,
        required: true
      },
      order_number: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },
      archive_status: {
        type: DataTypes.INTEGER,
        default: 0
      },
      order_kbitem: {
        type: DataTypes.TEXT,
        required: true
      },
      show_done_todo: {
        type: DataTypes.INTEGER,
        required: true,
        default: 1
      },
      add_new_obj_type: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },
      sort_by_type: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },
      kanban_type: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },
      archived_time: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      },
      order_update_time: DataTypes.DOUBLE(13, 3),
      created_date: {
        type: DataTypes.DOUBLE(13, 3),
        require: true
      },
      updated_date: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      }

    }, config);
  }
};

module.exports = Model;
