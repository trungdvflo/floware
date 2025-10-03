const config = {
  tableName: 'protect_page'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const ProtectPage = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        verify_code: {
          type: DataTypes.STRING,
          required: true
        },
        time_code_expire: {
          type: DataTypes.INTEGER,
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

    return ProtectPage;
  }
};

module.exports = Model;
