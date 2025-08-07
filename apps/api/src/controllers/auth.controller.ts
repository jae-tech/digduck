import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { Controller, Post, Get, Schema, Auth } from '../decorators/controller.decorator';
import { env } from '../config/env';
import type { LoginCredentials, RegisterData, User, JWTPayload } from '@repo/shared';

// 의존성 주입을 위한 전역 변수 (임시)
let appInstance: FastifyInstance;

export const setAppInstance = (app: FastifyInstance) => {
  appInstance = app;
};

@Controller('/auth')
export class AuthController {
  
  @Post('/login')
  @Schema({
    description: 'User login',
    tags: ['auth'],
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 }
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
              }
            }
          }
        }
      }
    }
  })
  async login(request: FastifyRequest<{ Body: LoginCredentials }>, reply: FastifyReply) {
    try {
      const { email, password } = request.body;

      // 간단한 사용자 조회 (실제로는 UserService 사용)
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await appInstance.pg.query(query, [email]);
      const user = result.rows[0];

      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const token = appInstance.jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      const { password: _, ...userWithoutPassword } = user;

      return reply.send({
        success: true,
        data: {
          token,
          user: userWithoutPassword
        }
      });
    } catch (error) {
      request.log.error('Login error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  @Post('/register')
  @Schema({
    description: 'User registration',
    tags: ['auth'],
    body: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        name: { type: 'string', minLength: 1 }
      }
    }
  })
  async register(request: FastifyRequest<{ Body: RegisterData }>, reply: FastifyReply) {
    try {
      const { email, password, name } = request.body;

      // 이메일 중복 확인
      const existingQuery = 'SELECT 1 FROM users WHERE email = $1';
      const existingResult = await appInstance.pg.query(existingQuery, [email]);
      
      if (existingResult.rows.length > 0) {
        return reply.status(409).send({
          success: false,
          error: 'Email already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

      const insertQuery = `
        INSERT INTO users (email, password, name) 
        VALUES ($1, $2, $3) 
        RETURNING id, email, name, created_at, updated_at
      `;
      const insertResult = await appInstance.pg.query(insertQuery, [email, hashedPassword, name]);
      const user = insertResult.rows[0];

      const token = appInstance.jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      return reply.status(201).send({
        success: true,
        data: {
          token,
          user
        }
      });
    } catch (error) {
      request.log.error('Register error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  @Get('/profile')
  @Auth()
  @Schema({
    description: 'Get user profile',
    tags: ['auth'],
    security: [{ bearerAuth: [] }]
  })
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user as JWTPayload;
      
      const query = 'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1';
      const result = await appInstance.pg.query(query, [user.userId]);
      const userData = result.rows[0];

      if (!userData) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
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
        error: 'Internal server error'
      });
    }
  }
}
