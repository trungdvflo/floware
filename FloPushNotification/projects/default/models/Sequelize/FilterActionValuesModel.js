
const config = {
    tableName: 'filter_action_values'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const FilterActionValues = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING,
                required: true
            },
            description: {
                type: DataTypes.STRING
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
            
        }, config);

        FilterActionValues.associate = (models) => {
            FilterActionValues.hasMany(models.rules_filter_actions, {
                as: 'rules_filter_actions', 
                foreignKey: 'filter_action_id'
            });
        };

        return FilterActionValues;
    }
};

module.exports = Model;

