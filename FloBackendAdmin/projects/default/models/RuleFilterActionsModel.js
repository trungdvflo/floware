const config = {
  tableName: 'rule_filter_action'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const RuleFilterActions = sequelize.define(
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

        filter_action_id: DataTypes.BIGINT,
        filter_action_value: {
          type: DataTypes.STRING
        },
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    RuleFilterActions.associate = (models) => {
      RuleFilterActions.belongsTo(models.collection, {
        as: 'project',
        foreignKey: 'filter_action_subvalue'
      });

      RuleFilterActions.belongsTo(models.rule, {
        as: 'rule',
        foreignKey: 'rule_id'
      });

      RuleFilterActions.belongsTo(models.user, {
        as: 'user',
        foreignKey: 'user_id'
      });

      RuleFilterActions.belongsTo(models.filter_action, {
        as: 'filter_action',
        foreignKey: 'filter_action_id'
      });
    };

    return RuleFilterActions;
  }
};

module.exports = Model;
