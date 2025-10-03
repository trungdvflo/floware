const config = {
  tableName: 'quota'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Quota = sequelize.define(
      config.tableName,
      {
        username: {
          type: DataTypes.STRING,
          primaryKey: true
        },
        bytes: DataTypes.BIGINT,
        messages: DataTypes.INTEGER,
        cal_bytes: DataTypes.BIGINT,
        card_bytes: DataTypes.BIGINT,
        file_bytes: DataTypes.BIGINT,
        num_sent: DataTypes.INTEGER,
        qa_bytes: DataTypes.BIGINT
      },
      config
    );
    return Quota;
  }
};

module.exports = Model;
