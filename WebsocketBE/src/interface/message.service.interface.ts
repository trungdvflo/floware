export interface IMessageService {
  sendToUser(): Promise<boolean>;
  sendToChannel(): Promise<boolean>;
}
