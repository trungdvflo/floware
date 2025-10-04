
const config = {
  tableName: 'subscription',
  model: 'SubscriptionModel'
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
      name: {
        type: DataTypes.INTEGER,
        required: true
      },
      price: {
        type: DataTypes.FLOAT,
        required: true,
        default: 0
      },
      period: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },
      auto_renew: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },
      description: {
        type: DataTypes.INTEGER,
        required: true
      },
      subs_type: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },
      order_number: {
        type: DataTypes.INTEGER,
        required: true,
        default: 1
      }

    }, config);
  }
};

module.exports = Model;
