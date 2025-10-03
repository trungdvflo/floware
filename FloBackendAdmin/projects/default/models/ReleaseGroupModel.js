const config = {
  tableName: 'release_group'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const ReleasesGroups = sequelize.define(
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
        group_id: {
          type: DataTypes.BIGINT,
          required: true
        },
        created_date: {
          type: DataTypes.DOUBLE(13, 3)
        },
        updated_date: {
          type: DataTypes.DOUBLE(13, 3)
        }
      },
      config
    );

    ReleasesGroups.associate = (models) => {
      ReleasesGroups.belongsTo(models.group, {
        as: 'group',
        foreignKey: 'group_id'
      });

      ReleasesGroups.belongsTo(models.release, {
        as: 'release',
        foreignKey: 'release_id'
      });
    };
    return ReleasesGroups;
  }
};

module.exports = Model;
