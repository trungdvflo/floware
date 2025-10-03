import { IReq } from "../src/common/interfaces";

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<{}>;
};

export const fakeReq: IReq = {
  user: {
    userId: 1,
    id: 1,
    email: 'iter001@flomail.net',
    appId: '',
    deviceUid: '',
    userAgent: '',
    token: '',
  },
  headers: {
    app_id: '',
    device_uid: "",
    authorization: ''
  }
};