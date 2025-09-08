export interface User {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  numeroCelular: string;
  role?: Role; // Objeto completo del rol cuando viene poblado del backend
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Role {
  id: string;
  nombre: string;
  descripcion?: string;
  permisos: Permission[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Permission {
  id: string;
  nombre: string;
  descripcion?: string;
  modulo: string;
  accion: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Tipos para empleados
export interface Employee {
  id: string;
  user: User;
  salarioPorHora: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para nómina
export interface Consumption {
  valor: number;
  descripcion: string;
}

export interface Payroll {
  id: string;
  employee: Employee;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  horasTrabajadas: number;
  minutosTrabajados: number;
  salarioBruto: number;
  consumos: Consumption[];
  totalConsumos: number;
  deudaMorchis: number;
  adelantoNomina: number;
  descuadre: number;
  totalDescuentos: number;
  salarioNeto: number;
  procesadoPor: User;
  estado: 'PENDIENTE' | 'PROCESADA' | 'PAGADA';
  fechaPago?: Date;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning';
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  token: string;
  permissions: string[];
  role: string;
}

export interface LoginSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Formularios
export interface UserFormData {
  nombre: string;
  apellido: string;
  correo: string;
  numeroCelular: string;
  role: string;
  password?: string; // Optional para updates, required para create
}

export interface CreateUserFormData extends UserFormData {
  password: string; // Required para crear usuario
}

export interface RoleFormData {
  nombre: string;
  descripcion?: string;
  permisoIds: string[];
}

export interface PermissionFormData {
  nombre: string;
  descripcion?: string;
  modulo: string;
  accion: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE';
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  roles: {
    total: number;
  };
  permissions: {
    total: number;
  };
  activities: {
    total: number;
    recent: number;
  };
}

export interface RecentActivity {
  userName: string;
  action: string;
  resource: string;
  details?: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning';
}
