const config = {
  tableName: 'cards'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Cards = sequelize.define(config.tableName, {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      addressbookid: {
        type: DataTypes.INTEGER,
        require: true
      },
      carddata: DataTypes.TEXT,
      uri: DataTypes.STRING,
      lastmodified: DataTypes.INTEGER,
      etag: 'VARBINARY(32)',
      size: {
        type: DataTypes.INTEGER,
        require: true
      }
    }, config);
    return Cards;
  }
};

module.exports = Model;
