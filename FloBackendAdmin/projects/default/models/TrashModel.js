const config = {
  tableName: 'trash_collection'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Trash = sequelize.define(
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
        obj_type: {
          type: DataTypes.STRING,
          field: 'object_type'
        },
        obj_id: {
          type: DataTypes.BIGINT,
          field: 'object_id'
        },
        obj_uid: {
          type: DataTypes.STRING,
          field: 'object_uid'
        },
        sync_token: DataTypes.TINYINT(2),
        status: DataTypes.TINYINT,
        trash_time: {
          type: DataTypes.DOUBLE(13, 3),
          default: 0.0
        },
        created_date: {
          type: DataTypes.DOUBLE(13, 3),
          default: 0.0
        },
        updated_date: {
          type: DataTypes.DOUBLE(13, 3),
          default: 0.0
        }
      },
      config
    );

    return Trash;
  }
};

module.exports = Model;
