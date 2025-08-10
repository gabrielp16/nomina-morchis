import type { User, Role, Permission, ActivityLog, ApiResponse, PaginatedResponse, UserFormData, CreateUserFormData, RoleFormData, PermissionFormData, DashboardStats, RecentActivity } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Tipos específicos para autenticación
export interface LoginData {
  correo: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  apellido: string;
  correo: string;
  numeroCelular: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    permissions: string[];
    role: string;
  };
  token: string;
}

// Función helper para las peticiones
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Si no hay contenido (como DELETE exitoso), retornar éxito
    if (response.status === 204) {
      return {
        success: true,
        data: null as T,
      };
    }

    const data = await response.json();

    // Manejar errores específicos de autenticación
    if (response.status === 401) {
      // Token expirado o inválido - limpiar localStorage y redirigir al login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Recargar la página para forzar el logout
        window.location.reload();
      }
      
      return {
        success: false,
        error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Error en la petición',
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

// Servicios de autenticación
export const authService = {
  // Login de usuario
  login: async (loginData: LoginData): Promise<ApiResponse<AuthResponse>> => {
    return fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  },

  // Registro de usuario
  register: async (registerData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    return fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });
  },

  // Verificar token
  me: async (): Promise<ApiResponse<User>> => {
    return fetchApi<User>('/auth/me');
  },

  // Verificar token (alternativo más específico)
  verify: async (): Promise<ApiResponse<{
    id: string;
    email: string;
    name: string;
    permissions: string[];
    role: string;
  }>> => {
    return fetchApi<{
      id: string;
      email: string;
      name: string;
      permissions: string[];
      role: string;
    }>('/auth/verify');
  },

  // Refrescar token
  refresh: async (): Promise<ApiResponse<{ token: string }>> => {
    return fetchApi<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });
  },
};

// CRUD Usuarios
export const userService = {
  getAll: async (page = 1, limit = 10, search?: string): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    
    return fetchApi<PaginatedResponse<User>>(`/users?${params}`);
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    return fetchApi<User>(`/users/${id}`);
  },

  create: async (userData: CreateUserFormData): Promise<ApiResponse<User>> => {
    return fetchApi<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: string, userData: Partial<UserFormData>): Promise<ApiResponse<User>> => {
    return fetchApi<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  activate: async (id: string): Promise<ApiResponse<User>> => {
    return fetchApi<User>(`/users/${id}/activate`, {
      method: 'PATCH',
    });
  },

  deactivate: async (id: string): Promise<ApiResponse<User>> => {
    return fetchApi<User>(`/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  },
};

// CRUD Roles
export const roleService = {
  getAll: async (page = 1, limit = 10, search?: string): Promise<ApiResponse<PaginatedResponse<Role>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    
    return fetchApi<PaginatedResponse<Role>>(`/roles?${params}`);
  },

  getById: async (id: string): Promise<ApiResponse<Role>> => {
    return fetchApi<Role>(`/roles/${id}`);
  },

  create: async (roleData: RoleFormData): Promise<ApiResponse<Role>> => {
    return fetchApi<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  update: async (id: string, roleData: Partial<RoleFormData>): Promise<ApiResponse<Role>> => {
    return fetchApi<Role>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/roles/${id}`, {
      method: 'DELETE',
    });
  },

  activate: async (id: string): Promise<ApiResponse<Role>> => {
    return fetchApi<Role>(`/roles/${id}/activate`, {
      method: 'PATCH',
    });
  },

  deactivate: async (id: string): Promise<ApiResponse<Role>> => {
    return fetchApi<Role>(`/roles/${id}/deactivate`, {
      method: 'PATCH',
    });
  },
};

// CRUD Permisos
export const permissionService = {
  getAll: async (page = 1, limit = 10, search?: string): Promise<ApiResponse<PaginatedResponse<Permission>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    
    return fetchApi<PaginatedResponse<Permission>>(`/permissions?${params}`);
  },

  getById: async (id: string): Promise<ApiResponse<Permission>> => {
    return fetchApi<Permission>(`/permissions/${id}`);
  },

  create: async (permissionData: PermissionFormData): Promise<ApiResponse<Permission>> => {
    return fetchApi<Permission>('/permissions', {
      method: 'POST',
      body: JSON.stringify(permissionData),
    });
  },

  update: async (id: string, permissionData: Partial<PermissionFormData>): Promise<ApiResponse<Permission>> => {
    return fetchApi<Permission>(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(permissionData),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/permissions/${id}`, {
      method: 'DELETE',
    });
  },

  activate: async (id: string): Promise<ApiResponse<Permission>> => {
    return fetchApi<Permission>(`/permissions/${id}/activate`, {
      method: 'PATCH',
    });
  },

  deactivate: async (id: string): Promise<ApiResponse<Permission>> => {
    return fetchApi<Permission>(`/permissions/${id}/deactivate`, {
      method: 'PATCH',
    });
  },
};

// Activity service
export const activityService = {
  getAll: async (page: number = 1, limit: number = 10, search?: string): Promise<ApiResponse<PaginatedResponse<ActivityLog>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    return fetchApi<PaginatedResponse<ActivityLog>>(`/activity?${params}`);
  },

  getById: async (id: string): Promise<ApiResponse<ActivityLog>> => {
    return fetchApi<ActivityLog>(`/activity/${id}`);
  },

  getUserActivity: async (userId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<ActivityLog>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return fetchApi<PaginatedResponse<ActivityLog>>(`/activity/user/${userId}?${params}`);
  },
};

// API para Dashboard
export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return fetchApi<DashboardStats>('/dashboard/stats');
  },

  getRecentActivities: async (limit: number = 10): Promise<ApiResponse<RecentActivity[]>> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    return fetchApi<RecentActivity[]>(`/dashboard/recent-activities?${params}`);
  },
};
