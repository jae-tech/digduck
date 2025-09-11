import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  nickname: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

// 이름 수정: LoginCredentialsSchema → LoginSchema
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// 이름 수정: RegisterDataSchema → RegisterSchema
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  nickname: z.string().optional(),
});

// 추가: UpdateUserSchema
export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  nickname: z.string().optional(),
});

// 타입 export (이름 수정)
export type User = z.infer<typeof UserSchema>;
export type LoginCredentials = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;

// 기존 interface들
export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  nickname?: string;
}

// 추가: JWT 타입
export interface JWTPayload {
  userId: string;
  email: string;
  licenseKey?: string;
  deviceId?: string;
  iat?: number;
  exp?: number;
}

// 추가: API 파라미터 타입들
export interface GetUserParams {
  id: string;
}
