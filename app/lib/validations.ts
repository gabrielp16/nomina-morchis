import { z } from 'zod';

// Esquemas de validación
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Formato de correo inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  correo: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Formato de correo inválido'),
  numeroCelular: z
    .string()
    .min(10, 'El número celular debe tener al menos 10 dígitos')
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Formato de número celular inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/(?=.*[a-z])/, 'Debe contener al menos una letra minúscula')
    .regex(/(?=.*[A-Z])/, 'Debe contener al menos una letra mayúscula')
    .regex(/(?=.*\d)/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const userSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  correo: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Formato de correo inválido'),
  numeroCelular: z
    .string()
    .min(10, 'El número celular debe tener al menos 10 dígitos')
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Formato de número celular inválido'),
  role: z
    .string()
    .min(1, 'Debe seleccionar un rol'),
});

export const roleSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  descripcion: z
    .string()
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .optional(),
  permisoIds: z
    .array(z.string())
    .min(1, 'Debe seleccionar al menos un permiso'),
});

export const permissionSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  descripcion: z
    .string()
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .optional(),
  modulo: z
    .string()
    .min(2, 'El módulo debe tener al menos 2 caracteres')
    .max(30, 'El módulo no puede exceder 30 caracteres'),
  accion: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'], {
    message: 'Debe seleccionar una acción',
  }),
});

// Tipos inferidos de los esquemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type RoleFormData = z.infer<typeof roleSchema>;
export type PermissionFormData = z.infer<typeof permissionSchema>;
