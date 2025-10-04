
const config = {
  tableName: 'calendars',
  model: 'CalendarModel'

};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    return sequelize.define(config.model, {
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
      components: DataTypes.STRING
    }, config);
  }
};

module.exports = Model;
