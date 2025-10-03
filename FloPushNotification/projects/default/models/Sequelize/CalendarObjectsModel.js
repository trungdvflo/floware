
const config = {
    tableName: 'calendarobjects'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const CalendarObject = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            calendardata: DataTypes.STRING,
            uri: 'VARBINARY(200)',
            calendarid: {
                type: DataTypes.INTEGER,
                require: true
            },

            etag: 'VARBINARY(32)',
            size: {
                type: DataTypes.INTEGER,
                require: true
            },
            componenttype: 'VARBINARY(255)',
            firstoccurence: DataTypes.INTEGER,
            lastoccurence: DataTypes.INTEGER,
            uid: DataTypes.STRING,
            invisible: {
                type: DataTypes.INTEGER,
                require: true,
                default: 0
            },
            lastmodified: DataTypes.INTEGER

        }, config);

        CalendarObject.associate = (models) => {
            CalendarObject.belongsTo(models.calendars, {
                as: 'calendar',
                foreignKey: 'calendarid'
            });
        };

        return CalendarObject;
    }
};

module.exports = Model;
