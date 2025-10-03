const config = {
  tableName: 'collection'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Projects = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },

        proj_name: {
          type: DataTypes.STRING,
          field: 'name',
          require: true
        },
        proj_color: {
          field: 'color',
          type: DataTypes.STRING
        },

        user_id: {
          type: DataTypes.BIGINT
        },
        calendar_id: {
          field: 'calendar_uri',
          type: DataTypes.STRING
        },
        parent_id: {
          type: DataTypes.BIGINT
        },
        flag: {
          type: DataTypes.TINYINT,
          require: true
        },
        proj_type: {
          type: DataTypes.TINYINT,
          field: 'type',
          require: true
        },
        info_card_order: {
          type: DataTypes.INTEGER,
          require: true
        },
        current_mode: {
          type: DataTypes.INTEGER,
          require: true
        },
        is_hide: {
          type: DataTypes.TINYINT,
          require: true
        },
        alerts: {
          type: DataTypes.STRING,
          require: true
        },
        state: {
          type: DataTypes.TINYINT
        },
        is_expand: {
          type: DataTypes.TINYINT,
          require: true
        },
        order_storyboard: {
          type: DataTypes.TEXT,
          require: true
        },
        order_kanban: {
          type: DataTypes.TEXT,
          require: true
        },
        view_mode: {
          type: DataTypes.TINYINT,
          require: true
        },
        view_sort: {
          type: DataTypes.TINYINT,
          require: true
        },
        kanban_mode: {
          type: DataTypes.TINYINT
        }
      },
      config
    );

    Projects.associate = (models) => {
      Projects.belongsTo(models.user, {
        as: 'user',
        foreignKey: 'user_id'
      });

      Projects.hasMany(models.rule_filter_action, {
        as: 'rule_filter_actions',
        foreignKey: 'filter_action_subvalue'
      });
    };

    return Projects;
  }
};

module.exports = Model;
