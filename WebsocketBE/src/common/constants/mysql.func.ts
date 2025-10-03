/**
 */
export type SQL_SP = {
  spName: string;
  spParam: number;
};

const regSqlSP = (spName: string, spParam: number): SQL_SP => ({ spName, spParam });

export const LIST_OF_DEVICE_TOKEN: SQL_SP = regSqlSP(`d2023_listOfDeviceTokenByEmail`, 2);
