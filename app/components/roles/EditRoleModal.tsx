import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { roleService, permissionService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Role, Permission } from '../../types/auth';

// Schema de validación para edición de rol
const editRoleSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  descripcion: z.string()
    .max(255, 'La descripción no puede exceder 255 caracteres')
    .optional(),
  permisos: z.array(z.string()).min(1, 'Debe seleccionar al menos un permiso')
});

type EditRoleFormData = z.infer<typeof editRoleSchema>;

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role;
}

export function EditRoleModal({ isOpen, onClose, onSuccess, role }: EditRoleModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<EditRoleFormData>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      permisos: role.permisos.map(p => p.id)
    }
  });

  const selectedPermissions = watch('permisos') || [];

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      // Resetear el formulario con los datos del rol
      reset({
        nombre: role.nombre,
        descripcion: role.descripcion || '',
        permisos: role.permisos.map(p => p.id)
      });
    }
  }, [isOpen, role, reset]);

  const loadPermissions = async () => {
    try {
      // Obtener todos los permisos con un límite alto
      const response = await permissionService.getAll(1, 1000);
      if (response.success && response.data) {
        setPermissions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const onSubmit = async (data: EditRoleFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await roleService.update(role.id, {
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        permisoIds: data.permisos
      });

      if (response.success) {
        success('Rol actualizado exitosamente');
        onSuccess();
        onClose();
      } else {
        const errorMessage = response.error || 'Error al actualizar el rol';
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

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    const currentPermissions = selectedPermissions;
    if (checked) {
      setValue('permisos', [...currentPermissions, permissionId]);
    } else {
      setValue('permisos', currentPermissions.filter(id => id !== permissionId));
    }
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
              Editar Rol: {role.nombre}
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

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Rol
                </label>
                <Input
                  id="nombre"
                  {...register('nombre')}
                  placeholder="Ingresa el nombre del rol"
                  className={cn(errors.nombre && "border-red-300")}
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  {...register('descripcion')}
                  rows={3}
                  placeholder="Describe las responsabilidades de este rol"
                  className={cn(
                    "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                    errors.descripcion && "border-red-300"
                  )}
                />
                {errors.descripcion && (
                  <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
                )}
              </div>

              {/* Permisos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permisos ({selectedPermissions.length} seleccionados)
                </label>
                {errors.permisos && (
                  <p className="mb-2 text-sm text-red-600">{errors.permisos.message}</p>
                )}
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                  <div className="grid grid-cols-1 gap-3">
                    {permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {permission.nombre}
                          </div>
                          {permission.descripcion && (
                            <div className="text-sm text-gray-500">
                              {permission.descripcion}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
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
                    Actualizar Rol
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
