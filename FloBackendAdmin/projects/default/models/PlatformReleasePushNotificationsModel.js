const config = {
  tableName: 'platform_release_push_notification'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const PlatformReleasePushNotifications = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        app_id: DataTypes.STRING,
        base_release_id: DataTypes.BIGINT,
        destination_release_id: DataTypes.BIGINT,
        title: DataTypes.STRING,
        message: DataTypes.STRING,
        force_update: DataTypes.TINYINT,
        status: DataTypes.TINYINT(4),
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    PlatformReleasePushNotifications.associate = (models) => {
      PlatformReleasePushNotifications.belongsTo(models.release, {
        as: 'basePlatformReleasePushNotifications',
        foreignKey: 'base_release_id'
      });

      PlatformReleasePushNotifications.belongsTo(models.release, {
        as: 'destinationPlatformReleasePushNotifications',
        foreignKey: 'destination_release_id'
      });
    };

    return PlatformReleasePushNotifications;
  }
};

module.exports = Model;
