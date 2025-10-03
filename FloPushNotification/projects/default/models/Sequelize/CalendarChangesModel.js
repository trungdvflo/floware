
const config = {
    tableName: 'calendarchanges'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const CalendarChange = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            uri: {
                type: DataTypes.STRING,
                require: true
            },
            synctoken: {
                type: DataTypes.INTEGER,
                require: true
            },
            calendarid: {
                type: DataTypes.INTEGER,
                require: true
            },
            operation: {
                type: DataTypes.INTEGER,
                require: true
            }
            
        }, config);
        return CalendarChange;
    }
};

module.exports = Model;
