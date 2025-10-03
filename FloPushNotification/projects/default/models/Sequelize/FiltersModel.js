
const config = {
    tableName: 'filters'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Filters = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            email: {
                type: DataTypes.STRING,
                required: true
            }, 
            objID: {
                type: DataTypes.INTEGER,
                field: 'objID'
            },
            objType: {
                type: DataTypes.INTEGER,
                field: 'objType'
            },
            data: DataTypes.STRING,
            description: DataTypes.STRING,
            created_date: DataTypes.INTEGER,
            updated_date: DataTypes.INTEGER
        }, config);
        
        return Filters;
    }
};

module.exports = Model;
