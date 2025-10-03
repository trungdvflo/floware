export enum SETTING_NAME {
  CHAT_NOTIFICATION = 'chat_notification',
  CHAT_TYPING = 'chat_typing',
  CHAT_NOTIFICATION_HIDE_MESSAGE = 'chat_notification_hide_message',
}

export enum SETTING_VALUE {
  ON = 'on',
  OFF = 'off',
}

export class SettingDto {
  email: string;
  private userSettingData: any;
  constructor(email: string, userSettingData: any) {
    this.email = email;
    this.userSettingData = userSettingData;
  }

  isTurnOnChatTyping() {
    return this.get(SETTING_NAME.CHAT_TYPING, SETTING_VALUE.ON) === SETTING_VALUE.ON;
  }

  isTurnOnChatNotification() {
    return this.get(SETTING_NAME.CHAT_NOTIFICATION, SETTING_VALUE.ON) === SETTING_VALUE.ON;
  }

  isChatNotificationHideMessage() {
    return (
      this.get(SETTING_NAME.CHAT_NOTIFICATION_HIDE_MESSAGE, SETTING_VALUE.OFF) === SETTING_VALUE.ON
    );
  }

  get(name: string, defaultValue: string) {
    if (name in this.userSettingData) {
      return this.userSettingData[name];
    }
    return defaultValue;
  }
}
