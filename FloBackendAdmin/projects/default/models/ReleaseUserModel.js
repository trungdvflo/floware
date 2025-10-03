const config = {
  tableName: 'release_user'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const ReleasesUsers = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        release_id: {
          type: DataTypes.BIGINT,
          required: true
        },
        user_id: {
          type: DataTypes.BIGINT,
          required: true
        },
        created_date: {
          type: DataTypes.DOUBLE(13, 3)
        }
      },
      config
    );

    ReleasesUsers.associate = (models) => {
      ReleasesUsers.belongsTo(models.user, {
        as: 'user',
        foreignKey: 'user_id'
      });

      ReleasesUsers.belongsTo(models.release, {
        as: 'release',
        foreignKey: 'release_id'
      });
    };
    return ReleasesUsers;
  }
};

module.exports = Model;
