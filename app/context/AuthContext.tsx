import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types/auth';
import { authService } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: Omit<AuthUser, 'token'>) => void;
  logout: () => void;
  updatePermissions: (permissions: string[]) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  verifyToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuración para verificación periódica
const VERIFY_INTERVAL = 5 * 60 * 1000; // 5 minutos en milisegundos
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  LAST_VERIFY: 'last_token_verify'
} as const;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const verifyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVerifyingRef = useRef(false);

  // Función para verificar si necesita verificación
  const shouldVerifyToken = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const lastVerify = localStorage.getItem(STORAGE_KEYS.LAST_VERIFY);
    if (!lastVerify) return true;
    
    const timeSinceLastVerify = Date.now() - parseInt(lastVerify);
    return timeSinceLastVerify >= VERIFY_INTERVAL;
  };

  // Función para actualizar timestamp de verificación
  const updateLastVerifyTime = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_VERIFY, Date.now().toString());
    }
  };

  // Configurar verificación periódica
  const setupPeriodicVerification = () => {
    if (verifyIntervalRef.current) {
      clearInterval(verifyIntervalRef.current);
    }

    verifyIntervalRef.current = setInterval(() => {
      if (user && !isVerifyingRef.current) {
        console.log('🔄 Verificación periódica del token...');
        verifyToken();
      }
    }, VERIFY_INTERVAL);
  };

  // Limpiar intervalo de verificación
  const clearPeriodicVerification = () => {
    if (verifyIntervalRef.current) {
      clearInterval(verifyIntervalRef.current);
      verifyIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Verificar si hay un token almacenado al inicializar (solo en el cliente)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser({ ...parsedUser, token });
          
          // Solo verificar si ha pasado el tiempo suficiente
          if (shouldVerifyToken()) {
            console.log('🔍 Verificando token al inicializar...');
            verifyToken();
          } else {
            console.log('✅ Token verificado recientemente, omitiendo verificación');
            setIsLoading(false);
            setupPeriodicVerification();
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          localStorage.removeItem(STORAGE_KEYS.LAST_VERIFY);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    } else {
      // En el servidor, directamente establecer loading a false
      setIsLoading(false);
    }

    // Cleanup al desmontar
    return () => {
      clearPeriodicVerification();
    };
  }, []);

  const verifyToken = async () => {
    if (typeof window === 'undefined' || isVerifyingRef.current) return;
    
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    isVerifyingRef.current = true;

    try {
      console.log('🔐 Verificando token con el servidor...');
      const response = await authService.verify();
      
      if (response.success && response.data) {
        // Token válido, actualizar datos del usuario
        const userData = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          permissions: response.data.permissions,
          role: response.data.role,
          token
        };
        
        setUser(userData);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          permissions: userData.permissions,
          role: userData.role
        }));
        
        updateLastVerifyTime();
        setupPeriodicVerification();
        console.log('✅ Token verificado exitosamente');
      } else {
        // Token inválido, limpiar datos
        console.log('❌ Token inválido, cerrando sesión');
        logout();
      }
    } catch (error) {
      console.error('❌ Error verifying token:', error);
      logout();
    } finally {
      isVerifyingRef.current = false;
      setIsLoading(false);
    }
  };

  const login = (token: string, userData: Omit<AuthUser, 'token'>) => {
    const fullUserData = { ...userData, token };
    setUser(fullUserData);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      updateLastVerifyTime();
      setupPeriodicVerification();
    }
    
    console.log('✅ Usuario logueado, configurando verificación periódica');
  };

  const logout = () => {
    console.log('👋 Cerrando sesión...');
    setUser(null);
    clearPeriodicVerification();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.LAST_VERIFY);
    }
  };

  const updatePermissions = (permissions: string[]) => {
    if (user) {
      const updatedUser = { ...user, permissions };
      setUser(updatedUser);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          permissions,
          role: user.role
        }));
      }
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.permissions.includes('MANAGE_ALL');
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role || user.role === 'SUPER_ADMIN';
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updatePermissions,
    hasPermission,
    hasRole,
    verifyToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
