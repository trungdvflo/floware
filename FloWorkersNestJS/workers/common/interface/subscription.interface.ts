export interface IEmailObject {
  email: string;
  subject: string;
  template: string;
  bytes: number;
  cal_bytes: number;
  card_bytes: number;
  file_bytes: number;
  percent: number;
  num_sent: number;
  expired: string;
  logo_url?: string;
  flo_copyright?: string;
}