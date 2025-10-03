const config = {
  tableName: 'filter_action'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const FilterActions = sequelize.define(
      config.tableName,
      {
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
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    FilterActions.associate = (models) => {
      FilterActions.hasMany(models.rule_filter_action, {
        as: 'rule_filter_actions',
        foreignKey: 'filter_action_id'
      });
    };

    return FilterActions;
  }
};

module.exports = Model;
