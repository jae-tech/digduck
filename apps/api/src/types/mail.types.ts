// 메일 발송 관련 타입 정의
export interface MailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface MailAttachment {
  filename: string
  content?: Buffer | string
  path?: string
  contentType?: string
}

export interface MailOptions {
  from: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  text?: string
  html?: string
  attachments?: MailAttachment[]
}

export interface MailTemplate {
  id: string
  name: string
  subject: string
  htmlTemplate: string
  textTemplate?: string
  variables: string[]
}

export interface MailSendResult {
  success: boolean
  messageId?: string
  error?: string
  rejectedRecipients?: string[]
}

export interface BulkMailOptions {
  template: string
  recipients: Array<{
    email: string
    variables?: Record<string, any>
  }>
  from: string
  subject?: string
}

export interface BulkMailResult {
  totalSent: number
  totalFailed: number
  results: Array<{
    email: string
    success: boolean
    messageId?: string
    error?: string
  }>
}

export enum MailProvider {
  SMTP = 'smtp',
  GMAIL = 'gmail',
  OUTLOOK = 'outlook'
}

export interface MailProviderConfig {
  provider: MailProvider
  config: MailConfig
}