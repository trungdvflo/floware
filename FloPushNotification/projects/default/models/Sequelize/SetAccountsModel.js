const config = {
    tableName: 'set_accounts'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const SetAccounts = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            server_income: {
                type: DataTypes.STRING,
                required: true
            },
            email_address: DataTypes.STRING,
            user_income: {
                type: DataTypes.STRING,
                required: true
            },
            pass_income: {
                type: DataTypes.STRING,
                required: true
            },
            port_income: {
                type: DataTypes.STRING,
                required: true
            },
            auth_key: DataTypes.INTEGER,
            auth_token: DataTypes.STRING,
            refresh_token: DataTypes.STRING,
            token_expire: DataTypes.INTEGER,
            full_name: DataTypes.STRING,
        
            auth_type: DataTypes.STRING,
            account_type: DataTypes.INTEGER,
            account_sync: DataTypes.STRING,
        
            useSSL_income: {
                type: DataTypes.INTEGER,
                field: 'useSSL_income'
            },
            type_income: DataTypes.INTEGER,
            server_smtp: DataTypes.STRING,
            user_smtp: {
                type: DataTypes.STRING,
                required: true
            },
            pass_smtp: {
                type: DataTypes.STRING,
                required: true
            },

            port_smtp: DataTypes.STRING,
        
            useSSL_smtp: {
                type: DataTypes.INTEGER,
                field: 'useSSL_smtp'
            },
            auth_type_smtp: DataTypes.INTEGER,
            server_caldav: DataTypes.STRING,
            server_path_caldav: DataTypes.STRING,
            port_caldav: DataTypes.STRING,

            useSSL_caldav: {
                type: DataTypes.INTEGER,
                field: 'useSSL_caldav'
            },
            useKerberos_caldav: {
                type: DataTypes.INTEGER,
                field: 'useKerberos_caldav'
            },
            
            description: DataTypes.STRING,
            provider: DataTypes.STRING,
            user_caldav: DataTypes.STRING,
            activated_push: DataTypes.INTEGER,
            signature: DataTypes.STRING,
        
            created_date: DataTypes.INTEGER,
            updated_date: DataTypes.INTEGER

        }, config);

        return SetAccounts;
    }
};

module.exports = Model;
