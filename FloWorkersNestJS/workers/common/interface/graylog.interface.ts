export interface IGraylog {
  moduleName: string;
  jobName?: string;
  message?: string;
  fullMessage?: object | string;
}