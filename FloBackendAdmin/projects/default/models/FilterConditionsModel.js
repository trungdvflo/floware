const config = {
  tableName: 'filter_condition'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const FilterConditions = sequelize.define(
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
        filter_type_ids: {
          type: DataTypes.STRING,
          required: true
        },
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    FilterConditions.associate = (models) => {
      FilterConditions.hasMany(models.rule_filter_condition, {
        as: 'rule_filter_conditions',
        foreignKey: 'filter_condition_id'
      });
    };

    return FilterConditions;
  }
};

module.exports = Model;
