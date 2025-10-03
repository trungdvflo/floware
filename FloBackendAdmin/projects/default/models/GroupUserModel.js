const config = {
  tableName: 'group_user'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const GroupsUsers = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3),
        group_id: {
          type: DataTypes.BIGINT,
          required: true
        },
        group_name: {
          type: DataTypes.STRING,
          required: true
        },
        user_id: {
          type: DataTypes.BIGINT,
          required: true
        },
        username: {
          type: DataTypes.STRING,
          required: true
        }
      },
      config
    );

    GroupsUsers.associate = (models) => {
      GroupsUsers.belongsTo(models.user, {
        as: 'user',
        foreignKey: 'user_id'
      });

      GroupsUsers.belongsTo(models.group, {
        as: 'groupsUsers',
        foreignKey: 'group_id'
      });
    };
    return GroupsUsers;
  }
};

module.exports = Model;
