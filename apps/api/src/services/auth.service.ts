import bcrypt from "bcryptjs";
import { FastifyInstance } from "fastify";
import { env } from "@/config/env";
import { UserService } from "./user.service";
import type { JWTPayload } from "@/types/auth.types";

// shared 타입들을 로컬에서 정의하거나 import
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export class AuthService {
  private userService: UserService;

  constructor(private app: FastifyInstance) {
    this.userService = new UserService(app.pg);
  }

  async login(
    credentials: LoginCredentials
  ): Promise<{ token: string; user: User }> {
    const { email, password } = credentials;

    // 사용자 조회
    const userWithPassword = await this.userService.getUserByEmail(email);
    if (!userWithPassword) {
      throw new Error("Invalid credentials");
    }

    // 비밀번호 확인
    const isValidPassword = await this.comparePassword(
      password,
      userWithPassword.password
    );
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // JWT 토큰 생성
    const payload: JWTPayload = {
      userId: userWithPassword.id,
      email: userWithPassword.email,
    };

    const token = this.app.jwt.sign(payload, { expiresIn: env.JWT_EXPIRES_IN });

    // 비밀번호 제외하고 반환
    const { password: _, ...user } = userWithPassword;

    return { token, user };
  }

  async register(
    userData: RegisterData
  ): Promise<{ token: string; user: User }> {
    const { email, password, name } = userData;

    // 이메일 중복 확인
    const existingUser = await this.userService.existsByEmail(email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // 비밀번호 해시
    const hashedPassword = await this.hashPassword(password);

    // 사용자 생성
    const user = await this.userService.createUser({
      email,
      password: hashedPassword,
      name,
    });

    // JWT 토큰 생성
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
    };

    const token = this.app.jwt.sign(payload, { expiresIn: env.JWT_EXPIRES_IN });

    return { token, user };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async refreshToken(userId: string): Promise<string> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
    };

    return this.app.jwt.sign(payload, { expiresIn: env.JWT_EXPIRES_IN });
  }

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      return this.app.jwt.verify(token) as JWTPayload;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  }

  private async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
