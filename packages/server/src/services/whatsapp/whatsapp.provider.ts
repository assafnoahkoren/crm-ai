export interface WhatsAppMessage {
  chatId: string;
  message: string;
  quotedMessageId?: string;
}

export interface WhatsAppSendResult {
  idMessage: string;
  success: boolean;
}

export interface IWhatsAppProvider {
  sendMessage(msg: WhatsAppMessage): Promise<WhatsAppSendResult>;
  getState(): Promise<{ state: string }>;
}
