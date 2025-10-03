
const config = {
    tableName: 'filter_conditions'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const FilterConditions = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING,
                required: true
            },
            filter_operator_ids: {
                type: DataTypes.STRING,
                required: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
            
        }, config);

        FilterConditions.associate = (models) => {
            FilterConditions.hasMany(models.rules_filter_conditions, {
                as: 'rules_filter_conditions', 
                foreignKey: 'filter_condition_id'
            });
        };

        return FilterConditions;
    }
};

module.exports = Model;

