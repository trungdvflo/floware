const config = {
  tableName: 'virtual_domain'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const VirtualDomains = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: DataTypes.STRING,
          required: true
        }
      },
      config
    );
    VirtualDomains.associate = (models) => {
      VirtualDomains.hasMany(models.user, {
        as: 'users',
        foreignKey: 'domain_id'
      });
    };

    return VirtualDomains;
  }
};

module.exports = Model;
