import bcrypt from "bcryptjs";
import { FastifyInstance } from "fastify";
import { env } from "@/config/env";
// import { UserService } from "./user.service";
import type { JWTPayload } from "@/types/auth.types";

// shared 타입들을 로컬에서 정의하거나 import
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async login(
    credentials: LoginCredentials
  ): Promise<{ token: string; user: User }> {
    // TODO: Implement UserService
    throw new Error("UserService not implemented");
  }

  async register(
    userData: RegisterData
  ): Promise<{ token: string; user: User }> {
    // TODO: Implement UserService
    throw new Error("UserService not implemented");
  }

  async getUserProfile(userId: number): Promise<User> {
    // TODO: Implement UserService
    throw new Error("UserService not implemented");
  }

  async updateUserProfile(
    userId: number,
    updateData: Partial<User>
  ): Promise<User> {
    // TODO: Implement UserService
    throw new Error("UserService not implemented");
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}