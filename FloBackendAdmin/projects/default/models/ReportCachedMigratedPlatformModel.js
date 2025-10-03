const config = {
  tableName: 'report_cached_migrated_platform'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const CachedMigratedPlatform = sequelize.define(
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
        app_reg_id: DataTypes.STRING,
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    CachedMigratedPlatform.associate = (models) => {
      CachedMigratedPlatform.hasMany(models.subscription_purchase, {
        sourceKey: 'user_id',
        foreignKey: 'user_id',
        as: 'subscriptionPurchase'
      });

      CachedMigratedPlatform.hasMany(models.group_user, {
        sourceKey: 'user_id',
        foreignKey: 'user_id',
        as: 'groupsUsers'
      });

      CachedMigratedPlatform.belongsTo(models.report_cached_user, {
        as: 'migratePlatform',
        foreignKey: 'user_id'
      });
    };
    return CachedMigratedPlatform;
  }
};

module.exports = Model;
