const config = {
  tableName: 'subscription_purchase'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const SubscriptionPurchase = sequelize.define(
      config.tableName,
      {
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
          field: 'sub_id',
          required: true
        },
        description: {
          type: DataTypes.STRING,
          required: true
        },

        purchase_type: {
          type: DataTypes.TINYINT,
          required: true,
          default: 0
        },
        purchase_status: {
          type: DataTypes.TINYINT,
          required: true,
          default: 1
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
          type: DataTypes.TINYINT,
          required: true,
          default: 0
        },
        created_date: {
          type: DataTypes.DOUBLE(13, 3),
          required: true
        }
      },
      config
    );

    SubscriptionPurchase.associate = (models) => {
      SubscriptionPurchase.belongsTo(models.report_cached_user, {
        foreignKey: 'user_id'
      });
    };

    return SubscriptionPurchase;
  }
};

module.exports = Model;
