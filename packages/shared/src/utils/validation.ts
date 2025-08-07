import { z } from 'zod';

export const validateEmail = (email: string): boolean => {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
};

export const isUUID = (value: string): boolean => {
  const uuidSchema = z.string().uuid();
  return uuidSchema.safeParse(value).success;
};
