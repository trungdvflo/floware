const config = {
  tableName: 'group',
  model: 'GroupModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    return sequelize.define(config.model, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        required: true
      },
      description: {
        type: DataTypes.TEXT
      },
      group_type: {
        type: DataTypes.STRING,
        required: true
      },
      internal_group: {
        type: DataTypes.STRING,
        required: true
      },

      created_date: {
        type: DataTypes.DOUBLE(13, 3),
        require: true
      },
      updated_date: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      }
    }, config);
  }
};

module.exports = Model;
