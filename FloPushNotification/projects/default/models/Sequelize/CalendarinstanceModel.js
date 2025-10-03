
const config = {
    tableName: 'calendarinstances',
    timestamps: false

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
            calendarid: {
                type: DataTypes.INTEGER
            },
            principaluri: {
                type: 'VARBINARY(100)'
            },
            access: {
                type: DataTypes.INTEGER
            },
            displayname: {
                type: DataTypes.STRING
            },
            uri: {
                type: 'VARBINARY(200)'
            },
            description: {
                type: DataTypes.TEXT
            },
            calendarorder: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            },
            calendarcolor: {
                type: DataTypes.STRING
            },
            timezone: {
                type: DataTypes.TEXT
            },
            transparent: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            },
            share_href: {
                type: 'VARBINARY(100)'
            },
            share_displayname: {
                type: DataTypes.STRING
            },
            share_invitestatus: {
                type: DataTypes.INTEGER
            }

        }, config);
        return Calendar;
    }
};

module.exports = Model;
