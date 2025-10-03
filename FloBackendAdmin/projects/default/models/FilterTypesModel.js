const config = {
  tableName: 'filter_operator'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const FilterTypes = sequelize.define(
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
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    FilterTypes.associate = (models) => {
      FilterTypes.hasMany(models.rule_filter_condition, {
        as: 'rule_filter_conditions',
        foreignKey: 'filter_operator_id'
      });
    };

    return FilterTypes;
  }
};

module.exports = Model;
