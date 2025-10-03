const config = {
    tableName: 'sync_emails_status'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const syncEmailsStatus = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },

            email_address: {
                type: DataTypes.STRING,
                required: true
            },
            app_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            uid: {
                type: DataTypes.STRING,
                required: true
            },
            imap_folder: {
                type: DataTypes.STRING,
                required: true
            },
            device_id: {
                type: DataTypes.STRING
            },
            expire_time: {
                type: DataTypes.INTEGER,
                required: true
            },
            status: {
                type: DataTypes.INTEGER,
                required: true
            },
            created_date: DataTypes.INTEGER,
            updated_date: DataTypes.INTEGER

        }, config);

        syncEmailsStatus.associate = (models) => {
            syncEmailsStatus.belongsTo(models.users, {
                as: 'user', 
                foreignKey: 'user_id'
            });
        };

        return syncEmailsStatus;
    }
};

module.exports = Model;
