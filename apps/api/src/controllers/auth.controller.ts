import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { Controller, Post, Get, Schema, Auth } from '../decorators/controller.decorator';
import { env } from '../config/env';
import type { LoginCredentials, RegisterData, User, JWTPayload } from '@repo/shared';
import { prisma } from '../plugins/prisma';

// 의존성 주입을 위한 전역 변수 (임시)
let appInstance: FastifyInstance;

export const setAppInstance = (app: FastifyInstance) => {
  appInstance = app;
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

      // 라이센스 검증
      const licenseData = await prisma.license_users.findUnique({
        where: { licenseKey },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      if (!licenseData) {
        return reply.status(401).send({
          success: false,
          error: '잘못된 라이센스 키'
        });
      }

      // 구독 확인
      const activeSubscription = await prisma.license_subscriptions.findFirst({
        where: {
          userEmail: licenseData.email,
          isActive: true,
          endDate: {
            gt: new Date()
          }
        }
      });

      if (!activeSubscription) {
        return reply.status(402).send({
          success: false,
          error: '라이센스가 만료되었거나 비활성 상태입니다'
        });
      }

      // 디바이스 활성화 확인 및 처리
      const activatedDevices = licenseData.activatedDevices as any[] || [];
      const isDeviceActivated = activatedDevices.some((device: any) => device.device_id === deviceId);
      
      if (!isDeviceActivated) {
        // 디바이스 한도 확인
        if (activatedDevices.length >= licenseData.allowedDevices) {
          return reply.status(400).send({
            success: false,
            error: '디바이스 한도 초과'
          });
        }

        // 새 디바이스 추가
        const newDevice = {
          device_id: deviceId,
          platform: platform,
          activated_at: new Date().toISOString()
        };
        const updatedDevices = [...activatedDevices, newDevice];

        // 디바이스 정보 업데이트
        await prisma.license_users.update({
          where: { licenseKey },
          data: { 
            activatedDevices: updatedDevices 
          }
        });
        
        // 업데이트된 디바이스 정보로 갱신
        activatedDevices.push(newDevice);
      }

      // JWT 토큰 생성
      const token = appInstance.jwt.sign(
        { 
          userId: licenseData.users.id, 
          email: licenseData.users.email, 
          licenseKey: licenseKey,
          deviceId: deviceId
        },
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      const user = {
        id: licenseData.users.id,
        email: licenseData.users.email,
        name: licenseData.users.name
      };

      return reply.send({
        success: true,
        data: {
          token,
          user,
          licenseInfo: {
            allowedDevices: licenseData.allowedDevices,
            activatedDevices: activatedDevices,
            isActive: true
          }
        }
      });
    } catch (error) {
      request.log.error('Login error:', error);
      return reply.status(500).send({
        success: false,
        error: '서버 내부 오류'
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

      // 이메일 중복 확인
      const existingUser = await prisma.users.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return reply.status(409).send({
          success: false,
          error: '이메일이 이미 존재합니다'
        });
      }

      // 사용자 생성
      const user = await prisma.users.create({
        data: {
          email,
          name
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });

      return reply.status(201).send({
        success: true,
        data: {
          user,
          message: '사용자가 성공적으로 등록되었습니다. 애플리케이션에 액세스하려면 라이센스 키를 획득하세요.'
        }
      });
    } catch (error) {
      console.error('등록 오류:', error);
      request.log.error('Register error:', error);
      return reply.status(500).send({
        success: false,
        error: '서버 내부 오류',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      } catch (err) {
        return reply.status(401).send({
          success: false,
          error: '인증되지 않음'
        });
      }
      
      const userData = await prisma.users.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!userData) {
        return reply.status(404).send({
          success: false,
          error: '사용자를 찾을 수 없습니다'
        });
      }

      return reply.send({
        success: true,
        data: userData
      });
    } catch (error) {
      request.log.error('Get profile error:', error);
      return reply.status(500).send({
        success: false,
        error: '서버 내부 오류'
      });
    }
  }
}
