const GetDataByType = (data) => {
  const result = [];
  switch (data.type) {
    case 'INSERT':
      data.affectedRows.map((row) => {
        result.push(row.after);
        return null;
      });
      break;

    case 'UPDATE':
      data.affectedRows.map((row) => {
        result.push(row.after);
        return null;
      });
      break;

    case 'DELETE':
      data.affectedRows.map((row) => {
        result.push(row.before);
        return null;
      });
      break;

    default:
      break;
  }

  return result;
};
const GetTable = (data) => {
  return data.table;
};

module.exports = { GetDataByType, GetTable };

