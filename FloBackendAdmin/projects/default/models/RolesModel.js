const config = {
  tableName: 'role'
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
        name: {
          type: DataTypes.STRING,
          required: true
        },
        role: {
          type: DataTypes.INTEGER,
          required: true
        },
        order_number: DataTypes.DOUBLE(13, 3),
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    return Groups;
  }
};

module.exports = Model;
