const config = {
  tableName: 'permission'
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
        feature_id: {
          type: DataTypes.INTEGER,
          required: true
        },
        role_id: {
          type: DataTypes.INTEGER,
          required: true
        },
        permission_value: {
          type: DataTypes.INTEGER,
          required: true
        },
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    return Groups;
  }
};

module.exports = Model;
