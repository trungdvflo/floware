
const config = {
    tableName: 'rules_filter_actions'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const RuleFilterActions = sequelize.define(config.tableName, {
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
            filter_action_id: DataTypes.INTEGER,
            filter_action_value: {
                type: DataTypes.STRING
            },
            filter_action_subvalue: {
                type: DataTypes.STRING
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
            
        }, config);

        RuleFilterActions.associate = (models) => {
            RuleFilterActions.belongsTo(models.projects, {
                as: 'project', 
                foreignKey: 'project_id'
            });

            RuleFilterActions.belongsTo(models.rules, {
                as: 'rule', 
                foreignKey: 'rule_id'
            });

            RuleFilterActions.belongsTo(models.users, {
                as: 'user', 
                foreignKey: 'user_id'
            });
            
            RuleFilterActions.belongsTo(models.filter_actions, {
                as: 'filter_action', 
                foreignKey: 'filter_action_id'
            });
        };

        return RuleFilterActions;
    }
};

module.exports = Model;
