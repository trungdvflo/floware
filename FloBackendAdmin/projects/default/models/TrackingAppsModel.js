const config = {
  tableName: 'tracking_app',
  timestamps: false
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const TrackingApps = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        name: DataTypes.STRING,
        app_version: DataTypes.STRING,
        flo_version: DataTypes.STRING,
        build_number: DataTypes.STRING,
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );
    TrackingApps.associate = (models) => {
      TrackingApps.hasMany(models.user_tracking_app, {
        as: 'users_tracking_app',
        foreignKey: 'tracking_app_id'
      });
    };
    return TrackingApps;
  }
};

module.exports = Model;
