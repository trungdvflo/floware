const config = {
  tableName: 'third_party_account'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const SetAccounts = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.BIGINT,
          default: 0,
          required: true
        },
        server_income: {
          type: DataTypes.STRING,
          required: true
        },
        email_address: {
          type: DataTypes.STRING
        },
        user_income: {
          type: DataTypes.STRING,
          required: true
        },
        pass_income: {
          type: DataTypes.STRING,
          required: true
        },
        port_income: {
          type: DataTypes.STRING,
          required: true
        },
        auth_key: {
          type: DataTypes.STRING
        },
        auth_token: {
          type: DataTypes.STRING
        },
        refresh_token: {
          type: DataTypes.STRING
        },
        token_expire: {
          type: DataTypes.INTEGER,
          default: 0
        },
        full_name: {
          type: DataTypes.STRING
        },

        auth_type: {
          type: DataTypes.INTEGER,
          default: 0
        },
        account_type: {
          type: DataTypes.INTEGER,
          default: 0
        },
        account_sync: {
          type: DataTypes.STRING
        },
        icloud_user_id: {
          type: DataTypes.STRING,
          required: true
        },

        useSSL_income: {
          type: DataTypes.INTEGER,
          default: 0,
          field: 'use_ssl_income'
        },
        type_income: {
          type: DataTypes.INTEGER,
          default: 0
        },
        server_smtp: {
          type: DataTypes.STRING
        },
        user_smtp: {
          type: DataTypes.STRING,
          required: true
        },
        pass_smtp: {
          type: DataTypes.STRING,
          required: true
        },

        port_smtp: {
          type: DataTypes.STRING
        },

        useSSL_smtp: {
          type: DataTypes.INTEGER,
          default: 0,
          field: 'use_ssl_smtp'
        },
        auth_type_smtp: {
          type: DataTypes.INTEGER,
          default: 0
        },
        server_caldav: {
          type: DataTypes.STRING
        },
        server_path_caldav: {
          type: DataTypes.STRING
        },
        port_caldav: {
          type: DataTypes.STRING
        },

        useSSL_caldav: {
          type: DataTypes.INTEGER,
          default: 0,
          field: 'use_ssl_caldav'
        },
        useKerberos_caldav: {
          type: DataTypes.INTEGER,
          default: 0,
          field: 'use_kerberos_caldav'
        },

        description: {
          type: DataTypes.STRING
        },
        provider: {
          type: DataTypes.STRING
        },
        user_caldav: {
          type: DataTypes.STRING,
          required: true
        },
        activated_push: {
          type: DataTypes.INTEGER,
          required: true,
          default: 0
        },
        signature: {
          type: DataTypes.TEXT,
          required: true
        },
        created_date: {
          type: DataTypes.DOUBLE(13, 3),
          required: true,
          default: 0.0
        },
        updated_date: {
          type: DataTypes.DOUBLE(13, 3),
          required: true,
          default: 0.0
        }
      },
      config
    );

    SetAccounts.associate = (models) => {
      SetAccounts.belongsTo(models.user, {
        as: 'user',
        foreignKey: 'user_id'
      });
    };

    return SetAccounts;
  }
};

module.exports = Model;
