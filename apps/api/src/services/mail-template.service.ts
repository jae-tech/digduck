import { MailTemplate } from '@/types/mail.types'

export class MailTemplateService {
  private templates: Map<string, MailTemplate> = new Map()

  constructor() {
    this.initializeDefaultTemplates()
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: MailTemplate[] = [
      {
        id: 'welcome',
        name: '환영 메일',
        subject: '{{companyName}}에 오신 것을 환영합니다!',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">안녕하세요 {{userName}}님!</h1>
            <p>{{companyName}}에 오신 것을 환영합니다.</p>
            <p>앞으로 많은 도움이 되는 서비스를 제공하겠습니다.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              <p><strong>시작하기:</strong></p>
              <ul>
                <li>프로필을 완성해보세요</li>
                <li>첫 번째 프로젝트를 만들어보세요</li>
                <li>고객지원팀에 문의하세요</li>
              </ul>
            </div>
            <p>감사합니다.<br/>{{companyName}} 팀</p>
          </div>
        `,
        textTemplate: `
안녕하세요 {{userName}}님!

{{companyName}}에 오신 것을 환영합니다.
앞으로 많은 도움이 되는 서비스를 제공하겠습니다.

시작하기:
- 프로필을 완성해보세요
- 첫 번째 프로젝트를 만들어보세요
- 고객지원팀에 문의하세요

감사합니다.
{{companyName}} 팀
        `,
        variables: ['userName', 'companyName']
      },
      {
        id: 'password-reset',
        name: '비밀번호 재설정',
        subject: '비밀번호 재설정 요청',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">비밀번호 재설정</h1>
            <p>안녕하세요 {{userName}}님,</p>
            <p>비밀번호 재설정을 요청하셨습니다.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">비밀번호 재설정</a>
            </div>
            <p style="color: #666; font-size: 14px;">이 링크는 {{expireTime}}분 후에 만료됩니다.</p>
            <p style="color: #666; font-size: 14px;">만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메일을 무시하세요.</p>
          </div>
        `,
        textTemplate: `
비밀번호 재설정

안녕하세요 {{userName}}님,

비밀번호 재설정을 요청하셨습니다.
다음 링크를 클릭하여 비밀번호를 재설정하세요:

{{resetUrl}}

이 링크는 {{expireTime}}분 후에 만료됩니다.
만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메일을 무시하세요.
        `,
        variables: ['userName', 'resetUrl', 'expireTime']
      },
      {
        id: 'notification',
        name: '일반 알림',
        subject: '{{title}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">{{title}}</h1>
            <p>안녕하세요 {{userName}}님,</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 0 5px 5px 0;">
              <p>{{message}}</p>
            </div>
            <p>감사합니다.<br/>{{companyName}} 팀</p>
          </div>
        `,
        textTemplate: `
{{title}}

안녕하세요 {{userName}}님,

{{message}}

감사합니다.
{{companyName}} 팀
        `,
        variables: ['userName', 'title', 'message', 'companyName']
      },
      {
        id: 'license-created',
        name: '라이센스 발급 완료',
        subject: '{{productName}} 라이센스가 발급되었습니다',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">라이센스 발급 완료</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">{{productName}}</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px;">안녕하세요 {{userName}}님!</h2>
              <p style="margin: 0; opacity: 0.9;">요청하신 라이센스가 성공적으로 발급되었습니다.</p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px;">📋 라이센스 정보</h3>
              <div style="margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 14px;">라이센스 키:</span><br/>
                <code style="background-color: #e2e8f0; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 14px; word-break: break-all; display: block; margin-top: 4px;">{{licenseKey}}</code>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <span style="color: #64748b; font-size: 14px;">사용자 이메일:</span><br/>
                  <strong style="color: #1e293b;">{{userEmail}}</strong>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 14px;">발급일:</span><br/>
                  <strong style="color: #1e293b;">{{issueDate}}</strong>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 14px;">만료일:</span><br/>
                  <strong style="color: #dc2626;">{{expirationDate}}</strong>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 14px;">라이센스 타입:</span><br/>
                  <strong style="color: #059669;">{{licenseType}}</strong>
                </div>
              </div>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #d97706; margin-right: 8px;">⚠️</span>
                <strong style="color: #92400e;">중요 사항</strong>
              </div>
              <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
                <li>라이센스 키를 안전한 곳에 보관해주세요</li>
                <li>라이센스 키는 타인과 공유하지 마세요</li>
                <li>만료일 이후에는 서비스 이용이 제한될 수 있습니다</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">서비스 시작하기</a>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                문의사항이 있으시면 언제든 연락해주세요.
              </p>
              <p style="color: #374151; font-size: 14px; margin: 0;">
                감사합니다.<br/>
                <strong>{{companyName}} 팀</strong>
              </p>
            </div>
          </div>
        `,
        textTemplate: `
라이센스 발급 완료 - {{productName}}

안녕하세요 {{userName}}님!

요청하신 라이센스가 성공적으로 발급되었습니다.

📋 라이센스 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
라이센스 키: {{licenseKey}}
사용자 이메일: {{userEmail}}
발급일: {{issueDate}}
만료일: {{expirationDate}}
라이센스 타입: {{licenseType}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 중요 사항
• 라이센스 키를 안전한 곳에 보관해주세요
• 라이센스 키는 타인과 공유하지 마세요
• 만료일 이후에는 서비스 이용이 제한될 수 있습니다

서비스 시작하기: {{loginUrl}}

문의사항이 있으시면 언제든 연락해주세요.

감사합니다.
{{companyName}} 팀
        `,
        variables: ['userName', 'productName', 'licenseKey', 'userEmail', 'issueDate', 'expirationDate', 'licenseType', 'loginUrl', 'companyName']
      },
      {
        id: 'license-expiry-warning',
        name: '라이센스 만료 경고',
        subject: '{{productName}} 라이센스 만료 안내 ({{daysLeft}}일 남음)',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0;">라이센스 만료 안내</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">{{productName}}</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px;">⏰ {{userName}}님의 라이센스가 곧 만료됩니다</h2>
              <p style="margin: 0; opacity: 0.9; font-size: 24px; font-weight: bold;">{{daysLeft}}일 후 만료</p>
            </div>

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 16px;">📋 현재 라이센스 정보</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <span style="color: #7f1d1d; font-size: 14px;">라이센스 키:</span><br/>
                  <code style="background-color: #fee2e2; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #991b1b;">{{licenseKey}}</code>
                </div>
                <div>
                  <span style="color: #7f1d1d; font-size: 14px;">만료일:</span><br/>
                  <strong style="color: #dc2626;">{{expirationDate}}</strong>
                </div>
              </div>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #d97706; margin-right: 8px;">💡</span>
                <strong style="color: #92400e;">만료 후 제한사항</strong>
              </div>
              <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
                <li>서비스 이용이 중단됩니다</li>
                <li>데이터 접근이 제한됩니다</li>
                <li>새로운 기능을 사용할 수 없습니다</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{renewUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500; margin-right: 10px;">라이센스 갱신하기</a>
              <a href="{{contactUrl}}" style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">문의하기</a>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #374151; font-size: 14px; margin: 0;">
                감사합니다.<br/>
                <strong>{{companyName}} 팀</strong>
              </p>
            </div>
          </div>
        `,
        textTemplate: `
라이센스 만료 안내 - {{productName}}

⏰ {{userName}}님의 라이센스가 곧 만료됩니다
{{daysLeft}}일 후 만료

📋 현재 라이센스 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
라이센스 키: {{licenseKey}}
만료일: {{expirationDate}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 만료 후 제한사항
• 서비스 이용이 중단됩니다
• 데이터 접근이 제한됩니다
• 새로운 기능을 사용할 수 없습니다

라이센스 갱신: {{renewUrl}}
문의하기: {{contactUrl}}

감사합니다.
{{companyName}} 팀
        `,
        variables: ['userName', 'productName', 'daysLeft', 'licenseKey', 'expirationDate', 'renewUrl', 'contactUrl', 'companyName']
      }
    ]

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  getTemplate(id: string): MailTemplate | undefined {
    return this.templates.get(id)
  }

  getAllTemplates(): MailTemplate[] {
    return Array.from(this.templates.values())
  }

  addTemplate(template: MailTemplate): void {
    this.templates.set(template.id, template)
  }

  updateTemplate(id: string, updates: Partial<MailTemplate>): boolean {
    const existing = this.templates.get(id)
    if (!existing) return false

    const updated = { ...existing, ...updates, id } // ID는 변경 불가
    this.templates.set(id, updated)
    return true
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id)
  }

  renderTemplate(templateId: string, variables: Record<string, any>): { subject: string; html: string; text?: string } | null {
    const template = this.getTemplate(templateId)
    if (!template) return null

    const replaceVariables = (content: string, vars: Record<string, any>): string => {
      return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return vars[key] !== undefined ? String(vars[key]) : match
      })
    }

    return {
      subject: replaceVariables(template.subject, variables),
      html: replaceVariables(template.htmlTemplate, variables),
      text: template.textTemplate ? replaceVariables(template.textTemplate, variables) : undefined
    }
  }

  validateTemplate(template: Partial<MailTemplate>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!template.id?.trim()) {
      errors.push('템플릿 ID가 필요합니다')
    }

    if (!template.name?.trim()) {
      errors.push('템플릿 이름이 필요합니다')
    }

    if (!template.subject?.trim()) {
      errors.push('제목이 필요합니다')
    }

    if (!template.htmlTemplate?.trim()) {
      errors.push('HTML 템플릿이 필요합니다')
    }

    if (!Array.isArray(template.variables)) {
      errors.push('변수 배열이 필요합니다')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  extractVariables(content: string): string[] {
    const matches = content.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []

    return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))]
  }
}