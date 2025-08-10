import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => void;
  error: (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => void;
  warning: (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => void;
  info: (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 5000, // 5 segundos por defecto
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remover el toast después de la duración especificada
    if (!newToast.persistent) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    addToast({ type: 'success', title, message, duration: 6000, ...options });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    addToast({ type: 'error', title, message, duration: 6000, ...options });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    addToast({ type: 'warning', title, message, duration: 6000, ...options });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    addToast({ type: 'info', title, message, duration: 6000, ...options });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

// Componente individual de Toast
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-white border-green-200 text-green-800';
      case 'error':
        return 'bg-white border-red-200 text-red-800';
      case 'warning':
        return 'bg-white border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-white border-blue-200 text-blue-800';
      default:
        return 'bg-white border-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border-l-4 ${getColorClasses()}`}
      style={{
        animation: 'toast-in 0.3s ease-out forwards',
      }}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm opacity-90">
                {toast.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
              onClick={() => onRemove(toast.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Container de Toasts
export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-4 py-6 pointer-events-none space-y-4">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

// Estilos CSS para las animaciones (agregar al CSS global)
export const toastStyles = `
  @keyframes toast-in {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes toast-out {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
`;
