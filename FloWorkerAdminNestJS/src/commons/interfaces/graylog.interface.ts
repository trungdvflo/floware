export interface IGraylog {
  moduleName: string;
  jobName?: string;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  fullMessage?: object | string;
}
