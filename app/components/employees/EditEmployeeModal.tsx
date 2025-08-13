import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../context/ToastContext';
import { employeeService } from '../../services/api';
import { z } from 'zod';
import type { Employee } from '../../types/auth';

// Schema específico para edición
const editEmployeeSchema = z.object({
  salarioPorHora: z
    .number()
    .min(0, 'El salario por hora debe ser positivo'),
});

type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
}

export function EditEmployeeModal({ isOpen, onClose, onSuccess, employee }: EditEmployeeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      salarioPorHora: employee.salarioPorHora
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        salarioPorHora: employee.salarioPorHora
      });
      setError(null);
    }
  }, [isOpen, employee, reset]);

  const onSubmit = async (data: EditEmployeeFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await employeeService.update(employee.id, {
        salarioPorHora: data.salarioPorHora
      });

      if (response.success) {
        success('Empleado actualizado exitosamente');
        onSuccess();
        onClose();
      } else {
        const errorMessage = response.error || 'Error al actualizar el empleado';
        showError(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMessage = 'Error al actualizar el empleado';
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
    <div className="fixed inset-0 bg-black/50 z-40 transition-opacity opacity-100 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Editar Empleado</h3>
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
            {/* Información del empleado */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Información del Empleado</h4>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {employee.user.nombre} {employee.user.apellido}
                  </div>
                  <div className="text-sm text-gray-500">{employee.user.correo}</div>
                </div>
              </div>
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
                Salario actual: {formatCurrency(employee.salarioPorHora)}
              </p>
            </div>
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
              disabled={isLoading}
            >
              {isLoading ? 'Actualizando...' : 'Actualizar Empleado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
