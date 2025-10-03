const config = {
  tableName: 'file'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const FileDb = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.BIGINT,
          require: true
        },
        uid: {
          type: DataTypes.STRING,
          require: true
        },
        local_path: DataTypes.TEXT,
        url: DataTypes.TEXT,
        source: {
          type: DataTypes.TINYINT,
          require: true
        },
        filename: {
          type: DataTypes.TEXT,
          require: true
        },
        ext: DataTypes.STRING,
        object_uid: {
          type: 'VARBINARY(1000)',
          require: true
        },
        object_type: {
          type: 'VARBINARY(50)',
          require: true
        },
        client_id: {
          type: DataTypes.STRING,
          require: true
        },
        size: {
          type: DataTypes.INTEGER,
          require: true
        },
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );
    return FileDb;
  }
};

module.exports = Model;
