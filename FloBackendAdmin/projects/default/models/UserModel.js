const config = {
  tableName: 'user'
};
const Model = {
  datastore: 'flowdataSequelize',
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

    User.associate = (models) => {
      User.hasMany(models.third_party_account, {
        as: 'set_account',
        foreignKey: 'user_id'
      });

      User.belongsTo(models.virtual_domain, {
        as: 'virtual_domain',
        foreignKey: 'domain_id'
      });
      User.hasMany(models.group_user, {
        as: 'groupUsers',
        foreignKey: 'user_id'
      });

      User.hasMany(models.release, {
        as: 'releases',
        foreignKey: 'user_id'
      });

      User.hasMany(models.rule, {
        as: 'rule',
        foreignKey: 'user_id'
      });

      User.hasMany(models.collection, {
        as: 'project',
        foreignKey: 'user_id'
      });

      User.hasMany(models.rule_filter_action, {
        as: 'rule_filter_action',
        foreignKey: 'user_id'
      });

      User.hasMany(models.rule_filter_condition, {
        as: 'rule_filter_condition',
        foreignKey: 'user_id'
      });

      User.hasOne(models.user_deleted, {
        as: 'deleted',
        foreignKey: 'id'
      });
    };

    return User;
  }
};

module.exports = Model;
