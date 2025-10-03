export enum SEND_STATUS {
  invite_call = 1,
  cancel_call = 2,
}

export enum REPLY_SEND_STATUS {
  call_success = 20,
  call_left = 21,
  call_busy = 22,
  call_declined = 23,
  call_not_answer = 24,
  call_cancel = 25,
}
export enum CALL_STATUS {
  dial_out = 1,
  dial_in = 2,
  un_answer = 3,
  miss_calling = 4,
}

export const APP_IDS = {
  web: 'e70f1b125cbad944424393cf309efaf0',
  mac: 'ad944424393cf309efaf0e70f1b125cb',
  iphone: 'faf0e70f1bad944424393cf309e125cb',
  ipad: 'd944424393cf309e125cbfaf0e70f1ba',
  sabreDav: '323d0aa8b591b15d68360faf4c853641',
  macInternal: 'fd99981046681b6bbc2124c72e569591',
};

export enum DEVICE_TYPE {
  FLO_IPAD_QC = 1,
  FLO_IPAD_PROD = 2,
  FLO_INTERNAL = 0,
  FLO_IPHONE_QC = 3,
  FLO_IPHONE_DEV = 4,
  FLO_MAC_PROD = 5,
  FLO_MAC_QC = 6,
}

export enum ENV_SILENT {
  SILENT = 0,
  ALERT = 1,
}

export enum CERT_ENV {
  PRODUCTION = 0,
  DEVELOPMENT = 1,
  VOIP_PRODUCTION = 2,
  VOIP_DEVELOPMENT = 3,
}

export enum DEVICE_TOKEN_TYPE {
  FLO_WEB = 'FLO_WEB',
  FLO_INTERNAL = 'FLO_INTERNAL',
  FLO_IPAD = 'FLO_IPAD',
  FLO_IPHONE = 'FLO_IPHONE',
  FLO_MAC = 'FLO_MAC',
}

export enum CALL_TYPE {
  video_call = 1,
  audio_call = 2,
}

export enum CALL_NOTIFICATION {
  BODY = 'is inviting you to a call',
}

export enum MAX_SIZE {
  CHAT_MESSAGE = 2048,
  EVENT_MESSAGE = 1024,
}
