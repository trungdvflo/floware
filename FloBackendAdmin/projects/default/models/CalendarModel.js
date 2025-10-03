
const config = {
    tableName: 'calendars'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Calendar = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            // principaluri: DataTypes.STRING,
            principaluri: 'VARBINARY(32)',
            displayname: DataTypes.STRING,
            uri: DataTypes.STRING,
            synctoken: {
                type: DataTypes.INTEGER,
                default: 1,
                required: true
            },
            description: DataTypes.STRING,
            calendarorder: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            },
            calendarcolor: DataTypes.STRING,
            timezone: DataTypes.STRING,
            components: DataTypes.STRING,
            transparent: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            },
            invisible: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            }

        }, config);

        Calendar.associate = (models) => {
            Calendar.hasMany(models.calendarobjects, {
                as: 'calendarObjects',
                foreignKey: 'calendarid'
            });
        };

        return Calendar;
    }
};

module.exports = Model;
