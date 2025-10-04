
const config = {
  tableName: 'restricted_user',
  model: 'RestrictedUserModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    return sequelize.define(config.model, {
      name: {
        type: DataTypes.STRING,
        required: true
      },
      type_matcher: {
        type: DataTypes.INTEGER,
        default: 0
      }
    }, config);
  }
};

module.exports = Model;
