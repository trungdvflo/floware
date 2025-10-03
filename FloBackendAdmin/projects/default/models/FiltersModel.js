const config = {
  tableName: 'filter'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Filters = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        email: {
          type: DataTypes.STRING,
          required: true
        },
        objID: {
          type: DataTypes.STRING,
          field: 'object_id'
        },
        objType: {
          type: DataTypes.INTEGER,
          field: 'object_type'
        },
        data: DataTypes.TEXT,
        description: DataTypes.TEXT,
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    return Filters;
  }
};

module.exports = Model;
