const config = {
  tableName: 'user'

};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Users = sequelize.define(config.tableName, {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING,
        required: true
      },
      email: {
        type: DataTypes.STRING,
        required: true
      },
      digesta1: DataTypes.STRING,
      secondary_email: {
        type: DataTypes.STRING,
        required: true
      },

      password: {
        type: DataTypes.STRING,
        required: true
      },
      fullname: {
        type: DataTypes.STRING,
        required: true
      },
      description: {
        type: DataTypes.STRING
      },
      rsa: {
        type: DataTypes.STRING,
        required: true
      },
      appreg_id: {
        type: DataTypes.STRING,
        required: true
      },

      domain_id: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      disabled: DataTypes.INTEGER,
      created_date: DataTypes.DOUBLE(13, 3),
      updated_date: DataTypes.DOUBLE(13, 3)
    }, config);
    return Users;
  }
};

module.exports = Model;
