
const config = {
  tableName: 'virtual_alias',
  model: 'VirtualAliasModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const VirtualAlias = sequelize.define(config.model, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      domain_id: {
        type: DataTypes.BIGINT,
        required: true
      },
      source: {
        type: DataTypes.STRING,
        required: true
      },
      destination: {
        type: DataTypes.STRING,
        required: true
      }
    }, config);
    return VirtualAlias;
  }
};

module.exports = Model;
