const config = {
  tableName: 'release'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Releases = sequelize.define(
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
        version: {
          type: DataTypes.STRING,
          required: true
        },
        checksum: {
          type: DataTypes.STRING,
          required: true
        },
        file_uid: {
          type: DataTypes.STRING,
          required: true
        },
        app_id: {
          type: DataTypes.STRING,
          required: true
        },
        build_number: {
          type: DataTypes.DECIMAL(16, 0),
          required: true
        },
        length: {
          type: DataTypes.INTEGER,
          required: true
        },
        file_dsym: {
          type: DataTypes.STRING,
          required: true
        },
        file_dsym_uid: {
          type: DataTypes.STRING,
          required: true
        },
        length_dsym: {
          type: DataTypes.INTEGER,
          required: true
        },
        url_download: DataTypes.STRING,
        release_note: DataTypes.STRING,
        release_type: {
          type: DataTypes.TEXT,
          required: true
        },
        description: DataTypes.TEXT,
        file_name: DataTypes.STRING,
        os_support: DataTypes.STRING,
        release_time: DataTypes.DOUBLE(13, 3),
        release_status: DataTypes.STRING,
        upload_status: DataTypes.TINYINT,
        title: DataTypes.STRING,
        message: DataTypes.STRING,
        expire_date: DataTypes.DOUBLE(13, 3),
        message_expire: DataTypes.STRING,
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    Releases.associate = (models) => {
      Releases.belongsTo(models.user, {
        as: 'user',
        foreignKey: 'user_id'
      });

      Releases.hasMany(models.release_group, {
        as: 'releaseGroups',
        foreignKey: 'release_id'
      });

      Releases.hasMany(models.release_user, {
        as: 'releaseUsers',
        foreignKey: 'release_id'
      });

      Releases.hasMany(models.platform_release_push_notification, {
        as: 'basePlatformReleasePushNotifications',
        foreignKey: 'base_release_id'
      });

      Releases.hasMany(models.platform_release_push_notification, {
        as: 'destinationPlatformReleasePushNotifications',
        foreignKey: 'destination_release_id'
      });
    };

    return Releases;
  }
};

module.exports = Model;
