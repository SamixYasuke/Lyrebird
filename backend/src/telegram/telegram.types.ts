export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    type: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  from?: {
    id: number;
    is_bot: boolean;
    first_name?: string;
    username?: string;
  };
  text?: string;
}

export interface TelegramUpdatesJob {
  serviceId: string;
  update: TelegramUpdate;
}
