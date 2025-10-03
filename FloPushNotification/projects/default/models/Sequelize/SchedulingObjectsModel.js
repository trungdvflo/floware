const config = {
    tableName: 'schedulingobjects',
    timestamps: false
};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const SchedulingObjects = sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                principaluri: DataTypes.STRING,
                calendardata: DataTypes.STRING,
                uri: DataTypes.STRING,
                lastmodified: DataTypes.INTEGER,
                etag: DataTypes.STRING,
                size: DataTypes.INTEGER
            },
            config
        );

        return SchedulingObjects;
    }
};

module.exports = Model;
