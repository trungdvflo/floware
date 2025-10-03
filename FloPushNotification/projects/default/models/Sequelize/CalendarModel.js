
const config = {
    tableName: 'calendars',
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
            synctoken: {
                type: DataTypes.INTEGER,
                default: 1,
                required: true
            },
            components: {
                type: DataTypes.STRING
            }

        }, config);
        return Calendar;
    }
};

module.exports = Model;
