const config = {
  tableName: 'users'
};
const Model = {
  datastore: 'flowdata32Sequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const User = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
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
        fullname: {
          type: DataTypes.STRING,
          required: true
        },
        rsa: {
          type: DataTypes.TEXT
        },
        disabled: DataTypes.TINYINT,
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    return User;
  }
};

module.exports = Model;
