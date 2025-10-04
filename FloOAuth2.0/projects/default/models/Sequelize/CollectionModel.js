
const config = {
  tableName: 'collection',
  model: 'CollectionModel'
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
        type: DataTypes.BIGINT
      },
      calendar_uri: {
        type: DataTypes.STRING
      },
      parent_id: {
        type: DataTypes.INTEGER
      },
      name: {
        type: DataTypes.STRING,
        require: true
      },
      type: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      color: {
        type: DataTypes.STRING
      },

      info_card_order: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      current_mode: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      alerts: {
        type: DataTypes.JSON
      },
      order_storyboard: {
        type: DataTypes.TEXT
      },
      order_kanban: {
        type: DataTypes.TEXT
      },
      state: {
        type: DataTypes.INTEGER,
        default: 1
      },
      flag: {
        type: DataTypes.INTEGER,
        require: true
      },
      is_hide: {
        type: DataTypes.INTEGER,
        require: true
      },

      is_expand: {
        type: DataTypes.INTEGER,
        require: true
      },
      view_mode: {
        type: DataTypes.INTEGER,
        require: true
      },

      view_sort: {
        type: DataTypes.INTEGER,
        require: true
      },
      kanban_mode: {
        type: DataTypes.INTEGER
      },

      due_date: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      },

      recent_time: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000,
        require: true
      },
      is_trashed: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
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
