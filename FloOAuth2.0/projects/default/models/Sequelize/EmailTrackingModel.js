const config = {
  tableName: 'email_tracking',
  model: 'EmailTrackingModel'
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
      account_id: {
        type: DataTypes.BIGINT,
        default: 0,
        required: true
      },
      object_uid: {
        type: DataTypes.STRING,
        default: '',
        require: true
      },
      emails: {
        type: DataTypes.STRING,
        default: ''
      },
      subject: {
        type: DataTypes.STRING,
        default: ''
      },
      status: {
        type: DataTypes.INTEGER
      },
      time_send: {
        type: DataTypes.DOUBLE(13, 3),
        required: true
      },
      time_tracking: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      },
      replied_time: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
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
