const config = {
  tableName: 'rule_filter_condition'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const RuleFilterConditions = sequelize.define(
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
        rule_id: {
          type: DataTypes.BIGINT,
          require: true
        },
        filter_condition_id: {
          type: DataTypes.BIGINT,
          require: true
        },
        filter_type_id: {
          type: DataTypes.BIGINT,
          require: true
        },
        filter_value: {
          type: DataTypes.STRING,
          require: true
        },
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    RuleFilterConditions.associate = (models) => {
      RuleFilterConditions.belongsTo(models.user, {
        as: 'user',
        foreignKey: 'user_id'
      });

      RuleFilterConditions.belongsTo(models.rule, {
        as: 'rule',
        foreignKey: 'rule_id'
      });

      RuleFilterConditions.belongsTo(models.filter_condition, {
        as: 'filter_condition',
        foreignKey: 'filter_condition_id'
      });

      RuleFilterConditions.belongsTo(models.filter_operator, {
        as: 'filter_type',
        foreignKey: 'filter_operator_id'
      });
    };
    return RuleFilterConditions;
  }
};

module.exports = Model;
