export interface ISmsProvider {
  sendOtp(phone: string, code: string): Promise<{ success: boolean }>;
}
