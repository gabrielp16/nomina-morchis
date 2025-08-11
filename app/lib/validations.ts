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

// Esquemas para empleados
export const employeeSchema = z.object({
  userId: z
    .string()
    .min(1, 'Debe seleccionar un usuario'),
  salarioPorHora: z
    .number()
    .min(0, 'El salario por hora debe ser positivo'),
});

// Esquemas para nómina
export const consumptionSchema = z.object({
  valor: z
    .number()
    .min(0, 'El valor debe ser positivo'),
  descripcion: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(200, 'La descripción no puede exceder 200 caracteres'),
});

export const payrollSchema = z.object({
  employeeId: z
    .string()
    .min(1, 'Debe seleccionar un empleado'),
  fecha: z
    .string()
    .min(1, 'La fecha es requerida'),
  horaInicio: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  horaFin: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  consumos: z
    .array(consumptionSchema),
  deudaMorchis: z
    .number()
    .min(0, 'La deuda debe ser positiva'),
  adelantoNomina: z
    .number()
    .min(0, 'El adelanto debe ser positivo'),
  observaciones: z
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
}).refine((data) => {
  // Validar que la hora de fin sea posterior a la de inicio
  const [inicioHora, inicioMinuto] = data.horaInicio.split(':').map(Number);
  const [finHora, finMinuto] = data.horaFin.split(':').map(Number);
  const inicioEnMinutos = inicioHora * 60 + inicioMinuto;
  const finEnMinutos = finHora * 60 + finMinuto;
  
  // Permitir trabajo nocturno (ej: 22:00 a 06:00 del día siguiente)
  return finEnMinutos !== inicioEnMinutos;
}, {
  message: 'La hora de fin debe ser diferente a la hora de inicio',
  path: ['horaFin'],
});

// Tipos inferidos de los esquemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type RoleFormData = z.infer<typeof roleSchema>;
export type PermissionFormData = z.infer<typeof permissionSchema>;
export type EmployeeFormData = z.infer<typeof employeeSchema>;
export type ConsumptionFormData = z.infer<typeof consumptionSchema>;
export type PayrollFormData = z.infer<typeof payrollSchema>;
