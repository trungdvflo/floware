
const config = {
  tableName: 'virtual_domain',
  model: 'VirtualDomainModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const VirtualDomain = sequelize.define(config.model, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        required: true
      }
    }, config);
    return VirtualDomain;
  }
};

module.exports = Model;
