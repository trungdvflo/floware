const config = {
  tableName: 'user_tracking_app',
  timestamps: false
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const UsersTrackingApps = sequelize.define(
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
        tracking_app_id: DataTypes.BIGINT,
        last_used_date: DataTypes.DOUBLE(13, 3),
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );
    UsersTrackingApps.associate = (models) => {
      UsersTrackingApps.belongsTo(models.tracking_app, {
        as: 'tracking_app',
        foreignKey: 'tracking_app_id'
      });
    };
    return UsersTrackingApps;
  }
};

module.exports = Model;
