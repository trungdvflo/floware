const config = {
  tableName: 'group'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Groups = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3),
        name: {
          type: DataTypes.STRING,
          required: true
        },
        description: DataTypes.TEXT,
        group_type: {
          type: DataTypes.ENUM('0', '1'),
          required: true
        },
        internal_group: {
          type: DataTypes.ENUM('0', '1', '2', '3', '4', '5', '6'),
          required: true
        }
      },
      config
    );

    Groups.associate = (models) => {
      Groups.hasMany(models.group_user, {
        as: 'GroupUser',
        foreignKey: 'group_id'
      });

      Groups.hasMany(models.release_group, {
        as: 'ReleaseGroup',
        foreignKey: 'group_id'
      });
    };
    return Groups;
  }
};

module.exports = Model;
