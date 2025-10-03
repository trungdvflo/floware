import { IMessage } from './message.interface';

export interface IMessageProvider {
  send(to: string[], message: IMessage): Promise<boolean>;
}
