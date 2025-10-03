
const config = {
    tableName: 'report_cached_users'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const ReportCachedUser = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            email: {
                type: DataTypes.STRING,
                required: true
            },
            account_3rd: DataTypes.INTEGER,
            account_3rd_emails: DataTypes.STRING,
            account_type: DataTypes.STRING,
            storage: DataTypes.INTEGER,
            groups: DataTypes.STRING,
            sub_id: DataTypes.STRING,
            subs_type: DataTypes.INTEGER,
            order_number: DataTypes.INTEGER,
            disabled: DataTypes.INTEGER,
            deleted: DataTypes.INTEGER,
            addition_info: DataTypes.STRING,
            subs_current_date: DataTypes.DOUBLE(13, 3),
            last_used_date: DataTypes.DOUBLE(13, 3),
            join_date: DataTypes.DOUBLE(13, 3),
            next_renewal: DataTypes.DOUBLE(13, 3),
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        }, config);
        return ReportCachedUser;
    }
};

module.exports = Model;
