import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { payrollService } from '../services/api';
import type { Employee } from '../types/auth';

interface EmployeeContextType {
  currentEmployee: Employee | null;
  isEmployee: boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshEmployee: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

interface EmployeeProviderProps {
  children: ReactNode;
}

export function EmployeeProvider({ children }: EmployeeProviderProps) {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);

  // Memoizar isAdmin para evitar recálculos innecesarios
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return hasPermission('MANAGE_PAYROLL');
  }, [user?.id, user?.permissions]);
  
  // Determinar si el usuario es empleado (tiene datos de empleado)
  const isEmployee = currentEmployee !== null;

  const loadEmployeeData = async () => {
    if (!isAuthenticated || !user || isAdmin) {
      setCurrentEmployee(null);
      return;
    }

    setLoading(true);
    try {
      const response = await payrollService.getMyEmployee();
      if (response.success && response.data) {
        setCurrentEmployee(response.data);
      } else {
        setCurrentEmployee(null);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      setCurrentEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshEmployee = async () => {
    await loadEmployeeData();
  };

  useEffect(() => {
    if (isAuthenticated && user && !isAdmin) {
      loadEmployeeData();
    } else {
      setCurrentEmployee(null);
    }
  }, [isAuthenticated, user?.id, isAdmin]);

  const value: EmployeeContextType = useMemo(() => ({
    currentEmployee,
    isEmployee,
    isAdmin,
    loading,
    refreshEmployee,
  }), [currentEmployee, isEmployee, isAdmin, loading]);

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
}
