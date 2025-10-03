import { AxiosInstance } from 'axios';

export { };
declare global {
  namespace NodeJS {
    interface Global {
      axios: AxiosInstance;
    }
  }
  const axios: NodeJS.Global['axios'];
}
