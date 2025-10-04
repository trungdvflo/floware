const config = {
  tableName: 'admin_promotion',
  model: 'AdminPromotionModel'
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
      allow_pre_signup: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      description: {
        type: DataTypes.STRING,
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
