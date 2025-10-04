const config = {
  tableName: 'user',
  model: 'UserModel'
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
      username: {
        type: DataTypes.STRING,
        required: true
      },
      digesta1: {
        type: DataTypes.STRING,
        require: true
      },
      domain_id: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },

      email: {
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
      secondary_email: {
        type: DataTypes.STRING,
        required: true
      },
      birthday: {
        type: DataTypes.STRING,
        required: true
      },
      gender: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      rsa: {
        type: DataTypes.TEXT,
        required: true
      },
      country: {
        type: DataTypes.TEXT,
        required: true
      },
      phone_number: {
        type: DataTypes.TEXT,
        required: true
      },
      country_code: {
        type: DataTypes.TEXT,
        required: true
      },
      token: {
        type: DataTypes.TEXT,
        required: true
      },
      question: {
        type: DataTypes.TEXT
      },
      answer: {
        type: DataTypes.TEXT
      },
      active_sec_email: {
        type: DataTypes.INTEGER,
        default: 0
      },
      max_uid: {
        type: DataTypes.BIGINT,
        required: true
      },

      activated_push: {
        type: DataTypes.INTEGER,
        default: 0
      },
      quota_limit_bytes: {
        type: DataTypes.BIGINT,
        default: 0
      },
      appreg_id: {
        type: DataTypes.STRING,
        required: true
      },
      disabled: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      token_expire: {
        type: DataTypes.DOUBLE(13, 3),
        required: true,
        default: 0.000
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
