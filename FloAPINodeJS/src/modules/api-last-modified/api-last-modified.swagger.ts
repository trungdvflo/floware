import { ApiLastModifiedName } from "../../common/constants";

export const GetInfo = {
  summary: 'Check last modified from server side. So, the client app can sync data changes from Flo server',
  summaryPut: 'Save last modified from server side. So, the client app can sync data changes from Flo server',
  description: `Specify the APIs to check, separate by comma. Available API names:\n
  ${Object.values(ApiLastModifiedName).join('<br/>')}
  \n\n Example: user,setting
  `
};