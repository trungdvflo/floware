const config = {
  tableName: 'rule'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Rules = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.BIGINT,
          require: true
        },
        name: {
          type: DataTypes.STRING,
          require: true
        },
        match_type: {
          type: DataTypes.TINYINT,
          require: true,
          default: 0
        },
        order_number: {
          type: DataTypes.INTEGER,
          require: true
        },
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    Rules.associate = (models) => {
      Rules.belongsTo(models.user, {
        as: 'user',
        foreignKey: 'user_id'
      });

      Rules.hasMany(models.rule_filter_action, {
        as: 'rule_filter_actions',
        foreignKey: 'rule_id',
        onDelete: 'CASCADE'
      });

      Rules.hasMany(models.rule_filter_condition, {
        as: 'rule_filter_conditions',
        foreignKey: 'rule_id',
        onDelete: 'CASCADE'
      });
    };

    return Rules;
  }
};

module.exports = Model;
