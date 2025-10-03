
const config = {
    tableName: 'filter_operators'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const FilterTypes = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING,
                required: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
            
        }, config);

        FilterTypes.associate = (models) => {
            FilterTypes.hasMany(models.rules_filter_conditions, {
                as: 'rules_filter_conditions', 
                foreignKey: 'filter_type_id'
            });
        };

        return FilterTypes;
    }
};

module.exports = Model;
