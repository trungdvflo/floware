
const config = {
    tableName: 'filter_actions'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const FilterActions = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING,
                required: true
            },
            filter_action_type: {
                type: DataTypes.ENUM('collection', 'number', 'string', 'combobox'),
                required: true
            },
            description: {
                type: DataTypes.STRING
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
            
        }, config);

        FilterActions.associate = (models) => {
            FilterActions.hasMany(models.rules_filter_actions, {
                as: 'rules_filter_actions', 
                foreignKey: 'filter_action_id'
            });
            FilterActions.hasMany(models.filter_action_values, {
                as: 'filter_action_values', 
                foreignKey: 'filter_action_id'
            });
        };

        return FilterActions;
    }
};

module.exports = Model;

