const { USER_MIGRATE_STATUS } = require("../constants/AppsConstant");

const config = {
  tableName: 'report_cached_user'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const CachedUsers = sequelize.define(
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
        email: {
          type: DataTypes.STRING,
          required: true
        },
        account_3rd: DataTypes.INTEGER,
        account_3rd_emails: DataTypes.TEXT,
        account_type: DataTypes.STRING,
        storage: DataTypes.STRING,
        groups: DataTypes.STRING,
        sub_id: DataTypes.STRING,
        subs_type: DataTypes.INTEGER,
        order_number: DataTypes.INTEGER,
        addition_info: DataTypes.STRING,
        disabled: DataTypes.TINYINT,
        deleted: DataTypes.TINYINT,
        subs_current_date: DataTypes.DOUBLE(13, 3),
        last_used_date: DataTypes.DOUBLE(13, 3),
        join_date: DataTypes.DOUBLE(13, 3),
        next_renewal: DataTypes.DOUBLE(13, 3),
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3),
        old_platform: DataTypes.JSON,
        platform: DataTypes.JSON,
        user_migrate_status: {
          type: DataTypes.TINYINT,
          required: true,
          default: USER_MIGRATE_STATUS.IS_V4
        }
      },
      config
    );

    CachedUsers.associate = (models) => {
      CachedUsers.hasMany(models.subscription_purchase, {
        sourceKey: 'user_id',
        foreignKey: 'user_id',
        as: 'subscriptionPurchase'
      });

      CachedUsers.hasMany(models.group_user, {
        sourceKey: 'email',
        foreignKey: 'username',
        as: 'groupsUsers'
      });

      CachedUsers.hasOne(models.report_cached_migrated_platform, {
        as: 'migratePlatform',
        sourceKey: 'user_id',
        foreignKey: 'user_id'
      });

      CachedUsers.hasOne(models.user_deleted, {
        as: 'userDeleted',
        sourceKey: 'user_id',
        foreignKey: 'user_id'
      });
    };
    return CachedUsers;
  }
};

module.exports = Model;
