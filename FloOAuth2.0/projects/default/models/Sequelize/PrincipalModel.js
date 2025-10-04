
const config = {
  tableName: 'principals',
  model: 'PrincipalModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    return sequelize.define(config.model, {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      uri: {
        type: DataTypes.STRING,
        required: true
      },
      email: {
        type: DataTypes.STRING
      },
      displayname: {
        type: DataTypes.STRING
      },
      vcardurl: {
        type: DataTypes.STRING
      }
    }, config);
  }
};

module.exports = Model;
