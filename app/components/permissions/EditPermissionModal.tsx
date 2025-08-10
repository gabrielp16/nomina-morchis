import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { permissionService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Permission, PermissionFormData } from '../../types/auth';
import { cn } from '~/lib/utils';

const editPermissionSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[A-Z][A-Z_]*$/, 'El nombre debe estar en mayúsculas y usar solo letras y guiones bajos (ej: CREATE_USERS)'),
  descripcion: z
    .string()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .optional(),
  modulo: z
    .string()
    .min(2, 'El módulo debe tener al menos 2 caracteres')
    .max(30, 'El módulo no puede exceder 30 caracteres')
    .regex(/^[A-Z][A-Z_]*$/, 'El módulo debe estar en mayúsculas (ej: USUARIOS, ROLES)'),
  accion: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'])
});

interface EditPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  permission: Permission;
}

const MODULOS_DISPONIBLES = [
  'USUARIOS',
  'ROLES', 
  'PERMISOS',
  'DASHBOARD',
  'REPORTES',
  'CONFIGURACION',
  'AUDITORIA',
  'NOMINA'
];

const ACCIONES_DISPONIBLES = [
  { value: 'CREATE', label: 'Crear', description: 'Crear nuevos registros' },
  { value: 'READ', label: 'Leer', description: 'Ver y consultar información' },
  { value: 'UPDATE', label: 'Actualizar', description: 'Modificar registros existentes' },
  { value: 'DELETE', label: 'Eliminar', description: 'Eliminar registros' },
  { value: 'MANAGE', label: 'Gestionar', description: 'Control total del módulo' }
];

export function EditPermissionModal({ isOpen, onClose, onSuccess, permission }: EditPermissionModalProps) {
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PermissionFormData>({
    resolver: zodResolver(editPermissionSchema)
  });

  const watchedModulo = watch('modulo');
  const watchedAccion = watch('accion');

  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: permission.nombre,
        descripcion: permission.descripcion || '',
        modulo: permission.modulo,
        accion: permission.accion
      });
    }
  }, [isOpen, permission, reset]);

  const onSubmit = async (data: PermissionFormData) => {
    setLoading(true);
    try {
      const response = await permissionService.update(permission.id, data);
      if (response.success) {
        success('Permiso actualizado exitosamente');
        onSuccess();
        onClose();
      } else {
        showError(response.error || 'Error al actualizar el permiso');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      showError('Error al actualizar el permiso');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Generar sugerencia de nombre basado en módulo y acción
  const generateSuggestion = () => {
    if (watchedModulo && watchedAccion) {
      return `${watchedAccion}_${watchedModulo}`;
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
        <div 
            className={cn(
            'fixed inset-0 bg-black/50 z-40 transition-opacity',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={handleClose}
        />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto z-50">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Permiso
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Información del permiso actual */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Información actual</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><span className="font-medium">ID:</span> {permission.id}</p>
                <p><span className="font-medium">Estado:</span> {permission.isActive ? 'Activo' : 'Inactivo'}</p>
                <p><span className="font-medium">Creado:</span> {new Date(permission.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Módulo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Módulo *
                </label>
                <select
                  {...register('modulo')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona un módulo</option>
                  {MODULOS_DISPONIBLES.map(modulo => (
                    <option key={modulo} value={modulo}>
                      {modulo}
                    </option>
                  ))}
                </select>
                {errors.modulo && (
                  <p className="mt-1 text-sm text-red-600">{errors.modulo.message}</p>
                )}
              </div>

              {/* Acción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Acción *
                </label>
                <select
                  {...register('accion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona una acción</option>
                  {ACCIONES_DISPONIBLES.map(accion => (
                    <option key={accion.value} value={accion.value}>
                      {accion.label} - {accion.description}
                    </option>
                  ))}
                </select>
                {errors.accion && (
                  <p className="mt-1 text-sm text-red-600">{errors.accion.message}</p>
                )}
              </div>

              {/* Nombre con sugerencia */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre del Permiso *
                  </label>
                  {generateSuggestion() && (
                    <button
                      type="button"
                      onClick={() => setValue('nombre', generateSuggestion())}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Usar sugerencia: {generateSuggestion()}
                    </button>
                  )}
                </div>
                <Input
                  {...register('nombre')}
                  placeholder="Ej: CREATE_USUARIOS"
                  className="w-full"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Debe estar en mayúsculas y usar solo letras y guiones bajos
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  {...register('descripcion')}
                  rows={3}
                  placeholder="Describe qué permite hacer este permiso..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.descripcion && (
                  <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto sm:ml-3"
            >
              {loading ? 'Actualizando...' : 'Actualizar Permiso'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
