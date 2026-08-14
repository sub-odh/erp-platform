export type SmtpEncryption = "SSL" | "STARTTLS" | "NONE";

export interface SmtpConfiguration {
  host: string;
  port: number;
  username: string;
  encryption: SmtpEncryption;
  fromEmail: string;
  senderName: string;
  isActive: boolean;
  hasPassword: boolean;
  lastTestedAt: string | null;
  lastTestSucceeded: boolean | null;
  lastError: string | null;
}

export interface UpdateSmtpConfigurationInput {
  host: string;
  port: number;
  username: string;
  password?: string;
  encryption: SmtpEncryption;
  fromEmail: string;
  senderName: string;
  isActive: boolean;
}
