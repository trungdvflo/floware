
const config = {
    tableName: 'rules'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Rules = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                require: true
            },
            name: {
                type: DataTypes.STRING,
                require: true
            },
            match_type: {
                type: DataTypes.INTEGER,
                require: true,
                default: 0
            },
            order_number: {
                type: DataTypes.INTEGER,
                require: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)            
        }, config);

        Rules.associate = (models) => {
            Rules.belongsTo(models.users, {
                as: 'user', 
                foreignKey: 'user_id'
            });

            Rules.hasMany(models.rules_filter_actions, {
                as: 'rules_filter_actions', 
                foreignKey: 'rule_id',
                onDelete: 'cascade'
            });

            Rules.hasMany(models.rules_filter_conditions, {
                as: 'rules_filter_conditions', 
                foreignKey: 'rule_id',
                onDelete: 'cascade'
            });
        };

        return Rules;
    }
};

module.exports = Model;
