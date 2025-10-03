
const config = {
    tableName: 'app_register'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const AppRegister = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            app_regId: {
                type: DataTypes.STRING,
                field: 'app_regId'
            },
            app_name: DataTypes.STRING,
            app_alias: DataTypes.STRING,
            email_register: DataTypes.STRING,
            created_date: DataTypes.INTEGER,
            updated_date: DataTypes.INTEGER

        }, config);

        return AppRegister;
    }
};

module.exports = Model;
