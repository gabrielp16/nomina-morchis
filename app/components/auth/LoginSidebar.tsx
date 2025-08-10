import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Eye, EyeOff, User, Mail, Phone, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { loginSchema, registerSchema } from '../../lib/validations';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService, type LoginData, type RegisterData } from '../../services/api';
import type { LoginFormData, RegisterFormData } from '../../lib/validations';
import type { LoginSidebarProps } from '../../types/auth';

export function LoginSidebar({ isOpen, onClose, mode, onModeChange }: LoginSidebarProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const { success, error: showError } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      correo: '',
      numeroCelular: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loginData: LoginData = {
        correo: data.email,
        password: data.password,
      };

      try {
        const response = await authService.login(loginData);
        
        if (!response.success) {
          throw new Error(response.error || 'Error en el login');
        }

        if (!response.data) {
          throw new Error('No se recibieron datos del servidor');
        }

        const { user, token } = response.data;
        
        // Usar la función login del contexto para almacenar los datos
        login(token, {
          id: user.id,
          email: user.email,
          name: user.name,
          permissions: user.permissions,
          role: user.role,
        });
        
        success('¡Bienvenido! Has iniciado sesión correctamente');
        onClose();
      } catch (apiError) {
        console.warn('Backend no disponible', apiError);
        showError('No se pudo conectar con el servidor. Verifica tu conexión.');
        setError('Problema de conectividad con el servidor');
        
        // Para propósitos de demo, crear un usuario mock si usa credenciales específicas
        if (data.email === 'admin@demo.com' && data.password === 'admin123') {
          const mockAdminUser = {
            id: '1',
            email: 'admin@demo.com',
            name: 'Administrador Demo',
            permissions: ['MANAGE_ALL'],
            role: 'ADMIN',
          };
          
          login('mock-jwt-token-admin', mockAdminUser);
          success('¡Bienvenido Administrador! Sesión iniciada en modo demo');
          onClose();
        }
      }
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el login';
      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Preparar datos para la API
      const registerData: RegisterData = {
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        numeroCelular: data.numeroCelular,
        password: data.password,
      };

      // Intentar conectar con el backend real
      try {
        const response = await authService.register(registerData);
        
        if (!response.success) {
          throw new Error(response.error || 'Error en el registro');
        }

        if (!response.data) {
          throw new Error('No se recibieron datos del servidor');
        }

        const { user, token } = response.data;
        
        // Hacer login automático después del registro
        login(token, {
          id: user.id,
          email: user.email,
          name: user.name,
          permissions: user.permissions,
          role: user.role,
        });
        
        success('¡Cuenta creada exitosamente! Has iniciado sesión automáticamente');
        onClose();
      } catch (apiError) {
        // Si el backend no está disponible, usar datos de prueba
        console.warn('Backend no disponible, usando datos de prueba:', apiError);
        showError('No se pudo conectar con el servidor. Usando modo demo.');
        
        const mockUser = {
          id: '2',
          email: data.correo,
          name: `${data.nombre} ${data.apellido}`,
          permissions: ['READ_USERS', 'READ_ROLES', 'READ_PERMISSIONS', 'READ_ACTIVITY'],
          role: 'USER',
        };
        
        login('mock-jwt-token-new-user', mockUser);
        success('¡Cuenta creada exitosamente en modo demo!');
        onClose();
      }
    } catch (error) {
      console.error('Error en registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el registro';
      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={cn(
          'fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="relative">
                  <Input
                    {...loginForm.register('email')}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    label="Correo electrónico"
                    error={loginForm.formState.errors.email?.message}
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                </div>

                <div className="relative">
                  <Input
                    {...loginForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    label="Contraseña"
                    error={loginForm.formState.errors.password?.message}
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    className="absolute right-3 top-8 h-5 w-5 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Iniciar Sesión
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      onModeChange('register');
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ¿No tienes cuenta? Regístrate
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      {...registerForm.register('nombre')}
                      placeholder="Nombre"
                      label="Nombre"
                      error={registerForm.formState.errors.nombre?.message}
                      className="pl-10"
                    />
                    <User className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="relative">
                    <Input
                      {...registerForm.register('apellido')}
                      placeholder="Apellido"
                      label="Apellido"
                      error={registerForm.formState.errors.apellido?.message}
                      className="pl-10"
                    />
                    <User className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="relative">
                  <Input
                    {...registerForm.register('correo')}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    label="Correo electrónico"
                    error={registerForm.formState.errors.correo?.message}
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                </div>

                <div className="relative">
                  <Input
                    {...registerForm.register('numeroCelular')}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    label="Número celular"
                    error={registerForm.formState.errors.numeroCelular?.message}
                    className="pl-10"
                  />
                  <Phone className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                </div>

                <div className="relative">
                  <Input
                    {...registerForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    label="Contraseña"
                    error={registerForm.formState.errors.password?.message}
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    className="absolute right-3 top-8 h-5 w-5 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    {...registerForm.register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    label="Confirmar contraseña"
                    error={registerForm.formState.errors.confirmPassword?.message}
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    className="absolute right-3 top-8 h-5 w-5 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Crear Cuenta
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      onModeChange('login');
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ¿Ya tienes cuenta? Inicia sesión
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
