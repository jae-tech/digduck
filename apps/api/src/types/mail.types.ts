// 메일 발송 관련 타입 정의
export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface MailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface MailOptions {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: MailAttachment[];
}

export interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables: string[];
}

export interface MailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rejectedRecipients?: string[];
}

export interface BulkMailOptions {
  template: string;
  recipients: Array<{
    email: string;
    variables?: Record<string, any>;
  }>;
  from: string;
  subject?: string;
}

export interface BulkMailResult {
  totalSent: number;
  totalFailed: number;
  results: Array<{
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export enum MailProvider {
  SMTP = "smtp",
  GMAIL = "gmail",
  OUTLOOK = "outlook",
  ZOHO = "zoho",
}

export interface MailProviderConfig {
  provider: MailProvider;
  config: MailConfig;
}

export enum MailStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  BOUNCED = "BOUNCED",
  OPENED = "OPENED",
  CLICKED = "CLICKED",
}

export interface MailHistory {
  id: number;
  userEmail?: string;
  fromEmail: string;
  toEmail: string;
  ccEmails: string[];
  bccEmails: string[];
  subject: string;
  templateId?: string;
  templateVars?: Record<string, any>;
  provider: MailProvider;
  messageId?: string;
  status: MailStatus;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMailHistoryData {
  userEmail?: string;
  fromEmail: string;
  toEmail: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  templateId?: string;
  templateVars?: Record<string, any>;
  provider: MailProvider;
}

export interface MailHistoryFilter {
  userEmail?: string;
  status?: MailStatus;
  provider?: MailProvider;
  templateId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}
