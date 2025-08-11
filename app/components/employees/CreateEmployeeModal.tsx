import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../../context/ToastContext';
import { employeeService } from '../../services/api';
import { employeeSchema, type EmployeeFormData } from '../../lib/validations';
import type { User as UserType } from '../../types/auth';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEmployeeModal({ isOpen, onClose, onSuccess }: CreateEmployeeModalProps) {
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
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
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      userId: '',
      salarioPorHora: 6500
    }
  });

  const selectedUserId = watch('userId');

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
      reset({
        userId: '',
        salarioPorHora: 6500
      });
      setError(null);
    }
  }, [isOpen, reset]);

  const loadAvailableUsers = async () => {
    try {
      const response = await employeeService.getAvailableUsers();
      if (response.success && response.data) {
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading available users:', error);
      showError('Error al cargar usuarios disponibles');
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await employeeService.create({
        userId: data.userId,
        salarioPorHora: data.salarioPorHora
      });

      if (response.success) {
        success('Empleado creado exitosamente');
        onSuccess();
        onClose();
      } else {
        const errorMessage = response.error || 'Error al crear el empleado';
        showError(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMessage = 'Error al crear el empleado';
      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Empleado</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario *
              </label>
              <Select
                {...register('userId')}
                onChange={(e) => setValue('userId', e.target.value)}
                value={selectedUserId}
                placeholder="Seleccionar usuario"
                disabled={isLoading || availableUsers.length === 0}
              >
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nombre} {user.apellido} ({user.correo})
                  </option>
                ))}
              </Select>
              {errors.userId && (
                <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
              )}
              {availableUsers.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  No hay usuarios disponibles para crear empleados
                </p>
              )}
            </div>

            {/* Salario por hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salario por Hora *
              </label>
              <Input
                type="number"
                step="100"
                min="0"
                {...register('salarioPorHora', { valueAsNumber: true })}
                placeholder="6500"
                disabled={isLoading}
              />
              {errors.salarioPorHora && (
                <p className="mt-1 text-sm text-red-600">{errors.salarioPorHora.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Valor predeterminado: {formatCurrency(6500)}
              </p>
            </div>

            {/* Previsualización */}
            {selectedUserId && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Resumen del Empleado</h4>
                {(() => {
                  const selectedUser = availableUsers.find(u => u.id === selectedUserId);
                  const salario = watch('salarioPorHora') || 6500;
                  return selectedUser ? (
                    <div className="text-sm text-blue-800">
                      <p><strong>Nombre:</strong> {selectedUser.nombre} {selectedUser.apellido}</p>
                      <p><strong>Email:</strong> {selectedUser.correo}</p>
                      <p><strong>Salario por hora:</strong> {formatCurrency(salario)}</p>
                      <p><strong>Salario diario (8h):</strong> {formatCurrency(salario * 8)}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedUserId || availableUsers.length === 0}
            >
              {isLoading ? 'Creando...' : 'Crear Empleado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
