
const config = {
    tableName: 'admin'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Admin = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            email: DataTypes.STRING,
            verify_code: DataTypes.STRING,
            time_code_expire: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            },
            role: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            }
        }, config);
        return Admin;
    }
};

module.exports = Model;
