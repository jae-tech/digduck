import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { Controller, Post, Get, Schema } from '../decorators/controller.decorator';
import type { JWTPayload } from '@repo/shared';
import { AuthService } from '../services/auth.service';

// 의존성 주입을 위한 전역 변수 (임시)
let appInstance: FastifyInstance;
let authService: AuthService;

export const setAppInstance = (app: FastifyInstance) => {
  appInstance = app;
  authService = new AuthService(app);
};

@Controller('/auth')
export class AuthController {
  
  @Post('/login')
  @Schema({
    description: 'User login with license key',
    tags: ['auth'],
    body: {
      type: 'object',
      required: ['licenseKey', 'deviceId'],
      properties: {
        licenseKey: { type: 'string' },
        deviceId: { type: 'string' },
        platform: { type: 'string', enum: ['WEB', 'DESKTOP'], default: 'WEB' }
      }
    },
    response: {
      200: {
        description: 'Successful login',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              licenseInfo: {
                type: 'object',
                properties: {
                  allowedDevices: { type: 'number' },
                  activatedDevices: { type: 'array' },
                  isActive: { type: 'boolean' }
                }
              },
              purchasedItems: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    itemType: { type: 'string' },
                    quantity: { type: 'number' },
                    purchasedAt: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async login(request: FastifyRequest<{ Body: { licenseKey: string; deviceId: string; platform?: string } }>, reply: FastifyReply) {
    try {
      const { licenseKey, deviceId, platform = 'WEB' } = request.body;

      const result = await authService.loginWithLicense({
        licenseKey,
        deviceId,
        platform: platform as "WEB" | "DESKTOP"
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      request.log.error('Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : '서버 내부 오류';
      
      // 에러 타입에 따른 상태 코드 설정
      let statusCode = 500;
      if (errorMessage.includes('잘못된 라이센스')) statusCode = 401;
      if (errorMessage.includes('만료되었거나')) statusCode = 402;
      if (errorMessage.includes('디바이스 한도')) statusCode = 400;
      
      return reply.status(statusCode).send({
        success: false,
        error: errorMessage
      });
    }
  }

  @Post('/register')
  @Schema({
    description: 'User registration (email and name only)',
    tags: ['auth'],
    body: {
      type: 'object',
      required: ['email', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 1 }
      }
    }
  })
  async register(request: FastifyRequest<{ Body: { email: string; name: string } }>, reply: FastifyReply) {
    try {
      const { email, name } = request.body;

      const user = await authService.register({ email, name });

      return reply.status(201).send({
        success: true,
        data: {
          user,
          message: '사용자가 성공적으로 등록되었습니다. 애플리케이션에 액세스하려면 라이센스 키를 획득하세요.'
        }
      });
    } catch (error) {
      request.log.error('Register error:', error);
      
      const errorMessage = error instanceof Error ? error.message : '서버 내부 오류';
      const statusCode = errorMessage.includes('이메일이 이미 존재') ? 409 : 500;
      
      return reply.status(statusCode).send({
        success: false,
        error: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  @Get('/profile')
  @Schema({
    description: 'Get user profile',
    tags: ['auth'],
    security: [{ bearerAuth: [] }]
  })
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 수동 JWT 검증 (임시 해결)
      let user: JWTPayload;
      try {
        user = (await request.jwtVerify()) as JWTPayload;
      } catch {
        return reply.status(401).send({
          success: false,
          error: '인증되지 않음'
        });
      }
      
      const userData = await authService.getUserProfile(parseInt(user.userId));

      return reply.send({
        success: true,
        data: userData
      });
    } catch (error) {
      request.log.error('Get profile error:', error);
      
      const errorMessage = error instanceof Error ? error.message : '서버 내부 오류';
      const statusCode = errorMessage.includes('사용자를 찾을 수 없습니다') ? 404 : 500;
      
      return reply.status(statusCode).send({
        success: false,
        error: errorMessage
      });
    }
  }
}
