
const config = {
  tableName: 'app_register',
  model: 'AppRegisterModel'
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
      app_reg_id: {
        type: DataTypes.STRING,
        required: true
      },
      app_alias: {
        type: DataTypes.STRING,
        required: true
      },
      email_register: {
        type: DataTypes.STRING,
        required: true
      },
      app_name: {
        type: DataTypes.STRING,
        required: true
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
