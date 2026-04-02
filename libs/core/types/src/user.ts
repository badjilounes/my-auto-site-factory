import { z } from 'zod';

export const UserRoleEnum = z.enum(['ADMIN', 'CLIENT']);

export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserCreateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: UserRoleEnum.optional(),
});

export type UserCreate = z.infer<typeof UserCreateSchema>;

export const UserUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: UserRoleEnum.optional(),
  image: z.string().url().optional(),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  emailVerified: z.coerce.date().nullable(),
  image: z.string().nullable(),
  role: UserRoleEnum,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginSchema>;
