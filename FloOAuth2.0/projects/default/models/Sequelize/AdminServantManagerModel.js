const config = {
    tableName: 'admin_servant_manager',
  };
  const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
      const AdminServantManager = sequelize.define(
        config.tableName,
        {
          id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
          },
          email: DataTypes.STRING,
          role: {
            type: DataTypes.TINYINT,
            default: 0,
            required: true
          }
        },
        config
      );
      return AdminServantManager;
    }
  };
  
  module.exports = Model;
  