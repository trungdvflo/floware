
const config = {
  tableName: 'addressbooks',
  model: 'AddressbookModel'

};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    return sequelize.define(this.model, {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      principaluri: {
        type: DataTypes.STRING
      },
      displayname: {
        type: DataTypes.STRING
      },
      uri: {
        type: DataTypes.STRING
      },
      description: {
        type: DataTypes.TEXT
      },
      synctoken: {
        type: DataTypes.INTEGER,
        default: 1,
        required: true
      }
    }, config);
  }
};

module.exports = Model;
