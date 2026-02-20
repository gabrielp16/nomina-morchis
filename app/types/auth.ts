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

// Para endpoints que no usan el objeto pagination anidado
export interface SimplePaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// Tipos para clientes
export interface Client {
  id: string;
  nombre: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  nit?: string;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Tipos para productos  
export interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  unidad: 'KG' | 'LT' | 'UN' | 'MT' | 'M2' | 'M3' | 'LB' | 'GAL' | 'OZ' | 'TON';
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  preciosPorCliente?: Array<{
    cliente: string;
    valor: number;
    id_producto: string;
    producto: string;
  }>;
}

// Tipos para precios de productos
export interface ProductPrice {
  id: string;
  producto: Product | string;
  cliente: Client | string;
  precio: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para formularios de precios
export interface ProductPriceFormData {
  producto: string;
  cliente: string;
  precio: number;
}

// Tipos para órdenes
export interface Order {
  id: string;
  fecha: Date;
  cliente: Client | string;
  producto: Product | string;
  lote: string;
  cantidad: number;
  precio: number;
  total: number;
  estado: 'POR PAGAR' | 'PAGADO' | 'CANCELADO' | 'ENTREGADO';
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Tipos para formularios de órdenes
export interface OrderFormData {
  fecha: Date;
  cliente: string;
  producto: string;
  lote: string;
  cantidad: number;
  precio: number;
  estado: 'POR PAGAR' | 'PAGADO' | 'CANCELADO' | 'ENTREGADO';
}

export interface CreateOrderFormData extends OrderFormData {}

// Tipos para filtros de órdenes
export interface OrderFilters {
  fechaInicio?: Date;
  fechaFin?: Date;
  cliente?: string;
  producto?: string;
  lote?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

// Tipos para estadísticas de órdenes
export interface OrderStats {
  total: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  sales: {
    totalAmount: number;
    averageOrder: number;
  };
  monthlyTrend: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
    totalAmount: number;
  }>;
  topProducts: Array<{
    _id: string;
    totalQuantity: number;
    totalAmount: number;
    orderCount: number;
    producto: Product;
  }>;
}
