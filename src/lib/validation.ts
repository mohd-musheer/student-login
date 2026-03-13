import { z } from 'zod';

// ── Faculty Schemas ──
export const facultyLoginSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30, 'Username must be under 30 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
});

export const facultyRegisterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30, 'Username must be under 30 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ── Student Schemas ──
export const studentLoginSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  rollNo: z.string().trim().min(1, 'Roll number is required').max(10, 'Roll number must be under 10 characters')
    .regex(/^[0-9]+$/, 'Roll number must contain only digits'),
});

export const addStudentSchema = z.object({
  name: z.string().trim().min(1, 'Student name is required').max(100, 'Name must be under 100 characters'),
  rollNo: z.string().trim().min(1, 'Roll number is required').max(10, 'Roll number must be under 10 characters')
    .regex(/^[0-9]+$/, 'Roll number must contain only digits'),
});

// ── Lecture Schemas ──
export const startLectureSchema = z.object({
  title: z.string().trim().min(1, 'Lecture title is required').max(200, 'Title must be under 200 characters'),
  room: z.string().trim().min(1, 'Room is required').max(50, 'Room must be under 50 characters'),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute').max(480, 'Duration cannot exceed 8 hours'),
});

// ── QR Code Schema ──
export const qrCodeSchema = z.string()
  .min(1, 'QR code is empty')
  .max(200, 'QR code is too long')
  .regex(/^DIGITALSCAN-\d+-[a-z0-9]+$/, 'Invalid QR code format');

// ── Helper to get first validation error message ──
export function getValidationError(result: z.SafeParseReturnType<unknown, unknown>): string | null {
  if (result.success) return null;
  return result.error.errors[0]?.message ?? 'Invalid input';
}
