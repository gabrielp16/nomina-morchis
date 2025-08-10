import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { userService, roleService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { User, Role } from '../../types/auth';

// Schema de validación para edición de usuario
const editUserSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  apellido: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  correo: z.string()
    .email('Debe ser un email válido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  numeroCelular: z.string()
    .min(10, 'El número debe tener al menos 10 dígitos')
    .max(15, 'El número no puede exceder 15 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
  role: z.string().min(1, 'Debe seleccionar un rol'),
  password: z.string()
    .optional()
    .refine((val) => !val || val.length >= 6, 'La contraseña debe tener al menos 6 caracteres')
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo,
      numeroCelular: user.numeroCelular,
      role: user.role?.id || '',
      password: ''
    }
  });

  const password = watch('password');

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      // Resetear el formulario con los datos del usuario
      reset({
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        numeroCelular: user.numeroCelular,
        role: user.role?.id || '',
        password: ''
      });
      setError(null);
    }
  }, [isOpen, user, reset]);

  const loadRoles = async () => {
    try {
      const response = await roleService.getAll(1, 1000);
      if (response.success && response.data) {
        // Filtrar solo roles activos
        const activeRoles = response.data.data.filter(role => role.isActive);
        setRoles(activeRoles);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const onSubmit = async (data: EditUserFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Preparar datos para enviar (omitir password si está vacío)
      const updateData: any = {
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        numeroCelular: data.numeroCelular,
        role: data.role
      };

      // Solo incluir password si no está vacío
      if (data.password && data.password.trim()) {
        updateData.password = data.password;
      }

      const response = await userService.update(user.id, updateData);

      if (response.success) {
        success('Usuario actualizado exitosamente');
        onSuccess();
        onClose();
      } else {
        const errorMessage = response.error || 'Error al actualizar el usuario';
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleClose}
      />

        <div className="relative inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Editar Usuario: {user.nombre} {user.apellido}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <Input
                  id="nombre"
                  {...register('nombre')}
                  placeholder="Nombre del usuario"
                  className={cn(errors.nombre && "border-red-300")}
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                )}
              </div>

              {/* Apellido */}
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <Input
                  id="apellido"
                  {...register('apellido')}
                  placeholder="Apellido del usuario"
                  className={cn(errors.apellido && "border-red-300")}
                />
                {errors.apellido && (
                  <p className="mt-1 text-sm text-red-600">{errors.apellido.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <Input
                  id="correo"
                  type="email"
                  {...register('correo')}
                  placeholder="correo@ejemplo.com"
                  className={cn(errors.correo && "border-red-300")}
                />
                {errors.correo && (
                  <p className="mt-1 text-sm text-red-600">{errors.correo.message}</p>
                )}
              </div>

              {/* Número Celular */}
              <div>
                <label htmlFor="numeroCelular" className="block text-sm font-medium text-gray-700 mb-1">
                  Número Celular *
                </label>
                <Input
                  id="numeroCelular"
                  {...register('numeroCelular')}
                  placeholder="1234567890"
                  className={cn(errors.numeroCelular && "border-red-300")}
                />
                {errors.numeroCelular && (
                  <p className="mt-1 text-sm text-red-600">{errors.numeroCelular.message}</p>
                )}
              </div>

              {/* Rol */}
              <div className="md:col-span-2">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  id="role"
                  {...register('role')}
                  className={cn(
                    "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                    errors.role && "border-red-300"
                  )}
                >
                  <option value="">Seleccionar rol</option>
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

              {/* Contraseña */}
              <div className="md:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña (opcional)
                </label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Dejar vacío para mantener la actual"
                  className={cn(errors.password && "border-red-300")}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Deja este campo vacío si no deseas cambiar la contraseña
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Actualizar Usuario
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
