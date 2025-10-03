
const config = {
    tableName: 'principals'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Principal = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            uri: {
                type: DataTypes.STRING,
                required: true
            },
            email: DataTypes.STRING,
            displayname: DataTypes.STRING,
            vcardurl: DataTypes.STRING
        }, config);
        return Principal;
    }
};

module.exports = Model;
