
const config = {
    tableName: 'rules_filter_conditions'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const RuleFilterConditions = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                require: true
            },
            rule_id: {
                type: DataTypes.INTEGER,
                require: true
            },
            filter_condition_id: {
                type: DataTypes.INTEGER,
                require: true
            },
            filter_operator_id: {
                type: DataTypes.INTEGER,
                require: true
            },
            filter_value: {
                type: DataTypes.STRING,
                require: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
            
        }, config);

        RuleFilterConditions.associate = (models) => {
            RuleFilterConditions.belongsTo(models.users, {
                as: 'user', 
                foreignKey: 'user_id'
            });

            RuleFilterConditions.belongsTo(models.rules, {
                as: 'rule', 
                foreignKey: 'rule_id'
            });

            RuleFilterConditions.belongsTo(models.filter_conditions, {
                as: 'filter_condition', 
                foreignKey: 'filter_condition_id'
            });

            RuleFilterConditions.belongsTo(models.filter_operators, {
                as: 'filter_operator', 
                foreignKey: 'filter_operator_id'
            });
        };
        return RuleFilterConditions;
    }
};

module.exports = Model;
