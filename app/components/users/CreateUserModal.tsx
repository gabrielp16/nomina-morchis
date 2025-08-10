import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, User, Mail, Phone, Key } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { userService, roleService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Role } from '../../types/auth';

// Schema de validación para crear usuario
const createUserSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'El apellido no puede exceder 50 caracteres'),
  correo: z.string().email('Ingresa un correo válido'),
  numeroCelular: z.string().min(10, 'Ingresa un número celular válido'),
  role: z.string().min(1, 'Selecciona un rol'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma la contraseña')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const loadRoles = async () => {
    try {
      const response = await roleService.getAll(1, 100); // Cargar todos los roles
      if (response.success && response.data) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { confirmPassword, ...userData } = data;
      const response = await userService.create(userData);

      if (response.success) {
        reset();
        success('Usuario creado exitosamente');
        onSuccess();
        onClose();
      } else {
        const errorMessage = response.error || 'Error al crear el usuario';
        showError(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl z-50 transform transition-all duration-300',
          isOpen ? 'scale-100' : 'scale-95'
        )}
      >
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Crear Nuevo Usuario
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    {...register('nombre')}
                    placeholder="Nombre"
                    label="Nombre"
                    error={errors.nombre?.message}
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                </div>
                
                <div className="relative">
                  <Input
                    {...register('apellido')}
                    placeholder="Apellido"
                    label="Apellido"
                    error={errors.apellido?.message}
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <Input
                  {...register('correo')}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  label="Correo electrónico"
                  error={errors.correo?.message}
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
              </div>

              <div className="relative">
                <Input
                  {...register('numeroCelular')}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  label="Número celular"
                  error={errors.numeroCelular?.message}
                  className="pl-10"
                />
                <Phone className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  {...register('role')}
                  className={cn(
                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    errors.role && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  )}
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nombre}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              <div className="relative">
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  label="Contraseña"
                  error={errors.password?.message}
                  className="pl-10"
                />
                <Key className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
              </div>

              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  label="Confirmar contraseña"
                  error={errors.confirmPassword?.message}
                  className="pl-10"
                />
                <Key className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Crear Usuario
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
