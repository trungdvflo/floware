
const config = {
  tableName: 'subscription_purchase',
  model: 'SubscriptionPurchaseModel'
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
      sub_id: {
        type: DataTypes.STRING,
        required: true
      },
      description: {
        type: DataTypes.STRING,
        required: true
      },

      transaction_id: {
        type: DataTypes.STRING,
        required: true
      },
      receipt_data: {
        type: DataTypes.TEXT,
        required: true
      },
      is_current: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },

      purchase_type: {
        type: DataTypes.INTEGER,
        required: true,
        default: 0
      },
      purchase_status: {
        type: DataTypes.STRING,
        required: true,
        default: 1
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
