import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { employeeService } from '../services/api';
import type { Employee } from '../types/auth';

interface EmployeesContextType {
  // Estados principales
  employees: Employee[];
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  
  // Cache management
  isStale: boolean;
  cacheExpiry: number; // minutes
  
  // Métodos de datos
  refreshEmployees: () => Promise<void>;
  getEmployeeById: (id: string) => Employee | undefined;
  invalidateCache: () => void;
  
  // Métodos de filtrado (computados)
  getActiveEmployees: () => Employee[];
  searchEmployees: (query: string) => Employee[];
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

interface EmployeesProviderProps {
  children: ReactNode;
  cacheExpiry?: number; // minutes, default 5
}

export function EmployeesProvider({ children, cacheExpiry = 5 }: EmployeesProviderProps) {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Verificar si el cache es admin-only
  const shouldLoadEmployees = useMemo(() => {
    return isAuthenticated && user && hasPermission('READ_USERS');
  }, [isAuthenticated, user?.id, user?.permissions]);

  // Verificar si el cache está obsoleto
  const isStale = useMemo(() => {
    if (!lastFetch) return true;
    const now = new Date();
    const diffMinutes = (now.getTime() - lastFetch.getTime()) / (1000 * 60);
    return diffMinutes > cacheExpiry;
  }, [lastFetch, cacheExpiry]);

  // Cargar empleados con optimización de cache
  const loadEmployees = async (force = false) => {
    if (!shouldLoadEmployees) {
      setEmployees([]);
      setLastFetch(null);
      return;
    }

    // Si no es forzado y el cache es válido, no hacer nada
    if (!force && !isStale && employees.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar limit más alto para admin users
      const response = await employeeService.getAll(1, 100);
      
      if (response.success && response.data) {
        setEmployees(response.data.data);
        setLastFetch(new Date());
        setError(null);
      } else {
        setError(response.error || 'Error al cargar empleados');
      }
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setError(err.message || 'Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  const refreshEmployees = async () => {
    await loadEmployees(true);
  };

  const invalidateCache = () => {
    setLastFetch(null);
    setEmployees([]);
  };

  // Métodos de búsqueda optimizados
  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };

  const getActiveEmployees = (): Employee[] => {
    return employees.filter(emp => emp.isActive);
  };

  const searchEmployees = (query: string): Employee[] => {
    if (!query.trim()) return employees;
    
    const lowerQuery = query.toLowerCase();
    return employees.filter(emp => 
      emp.user.nombre.toLowerCase().includes(lowerQuery) ||
      emp.user.apellido.toLowerCase().includes(lowerQuery) ||
      emp.user.correo.toLowerCase().includes(lowerQuery) ||
      (emp.user.numeroCelular && emp.user.numeroCelular.includes(query))
    );
  };

  // Auto-load cuando cambia la autenticación o permisos
  useEffect(() => {
    if (shouldLoadEmployees) {
      loadEmployees();
    } else {
      setEmployees([]);
      setLastFetch(null);
    }
  }, [shouldLoadEmployees]);

  // Auto-refresh cuando el cache expira (opcional)
  useEffect(() => {
    if (shouldLoadEmployees && isStale && employees.length > 0) {
      // Refresh silencioso en background si el cache está obsoleto
      loadEmployees();
    }
  }, [isStale, shouldLoadEmployees]);

  const value: EmployeesContextType = useMemo(() => ({
    employees,
    loading,
    error,
    lastFetch,
    isStale,
    cacheExpiry,
    refreshEmployees,
    getEmployeeById,
    invalidateCache,
    getActiveEmployees,
    searchEmployees,
  }), [
    employees,
    loading,
    error,
    lastFetch,
    isStale,
    cacheExpiry
  ]);

  return (
    <EmployeesContext.Provider value={value}>
      {children}
    </EmployeesContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeesContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeesProvider');
  }
  return context;
}

// Hook especializado para casos donde necesitas garantizar datos frescos
export function useEmployeesWithRefresh() {
  const context = useEmployees();
  
  useEffect(() => {
    if (context.isStale) {
      context.refreshEmployees();
    }
  }, []);

  return context;
}