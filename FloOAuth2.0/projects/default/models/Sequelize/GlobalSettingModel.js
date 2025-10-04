const config = {
  tableName: 'global_config_default'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const GlobalSetting = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        working_time: {
          type: DataTypes.JSON,
          required: true
        },
        week_start: {
          type: DataTypes.INTEGER,
          default: 0
        },
        event_duration: {
          type: DataTypes.INTEGER,
          default: 0
        },
        alert_before: {
          type: DataTypes.INTEGER,
          default: 60
        },
        default_alert_ade: {
          type: DataTypes.INTEGER,
          default: 0
        },
        due_task: {
          type: DataTypes.INTEGER,
          default: 0
        },
        default_alert_todo: {
          type: DataTypes.INTEGER,
          default: 0
        },
        snooze_default: {
          type: DataTypes.INTEGER,
          default: 15
        },
        task_duration: {
          type: DataTypes.INTEGER,
          default: 0
        },
        created_date: {
          type: DataTypes.DOUBLE(13, 3),
          required: true,
          default: 0.0
        },
        updated_date: {
          type: DataTypes.DOUBLE(13, 3),
          required: true,
          default: 0.0
        }
      },
      config
    );
    return GlobalSetting;
  }
};

module.exports = Model;
