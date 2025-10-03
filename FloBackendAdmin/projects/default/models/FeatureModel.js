const config = {
  tableName: 'feature'
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
        api_name: {
          type: DataTypes.STRING,
          required: true
        },
        method: {
          type: DataTypes.STRING,
          required: true
        },
        parent_id: {
          type: DataTypes.INTEGER,
          required: true
        },
        permission_value: {
          type: DataTypes.INTEGER,
          required: true
        },
        order_number: DataTypes.DOUBLE(13, 3),
        created_by: {
          type: DataTypes.STRING,
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
