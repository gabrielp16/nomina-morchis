import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Trash2, Calculator } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../../context/ToastContext';
import { payrollService } from '../../services/api';
import { z } from 'zod';
import type { Payroll } from '../../types/auth';

// Schema específico para edición de nómina
const editPayrollSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  horaFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  consumos: z.array(z.object({
    valor: z.number().min(0, 'El valor debe ser positivo'),
    descripcion: z.string().min(1, 'La descripción es requerida').max(200, 'La descripción no puede exceder 200 caracteres'),
  })),
  deudaMorchis: z.number().min(0, 'La deuda debe ser positiva'),
  adelantoNomina: z.number().min(0, 'El adelanto debe ser positivo'),
  estado: z.enum(['PENDIENTE', 'PROCESADA', 'PAGADA']),
  observaciones: z.string().max(500, 'Las observaciones no pueden exceder 500 caracteres').optional(),
});

type EditPayrollFormData = z.infer<typeof editPayrollSchema>;

interface EditPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payroll: Payroll;
  isEmployeeView?: boolean;
}

export function EditPayrollModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  payroll, 
  isEmployeeView = false 
}: EditPayrollModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedValues, setCalculatedValues] = useState({
    horasTrabajadas: 0,
    minutosTrabajados: 0,
    salarioBruto: 0,
    subtotalConsumos: 0,
    descuentoConsumos: 0,
    totalConsumos: 0,
    totalDescuentos: 0,
    salarioNeto: 0
  });
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control
  } = useForm<EditPayrollFormData>({
    resolver: zodResolver(editPayrollSchema),
    defaultValues: {
      fecha: new Date(payroll.fecha).toISOString().split('T')[0],
      horaInicio: payroll.horaInicio,
      horaFin: payroll.horaFin,
      consumos: payroll.consumos,
      deudaMorchis: payroll.deudaMorchis,
      adelantoNomina: payroll.adelantoNomina,
      estado: payroll.estado,
      observaciones: payroll.observaciones || ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'consumos'
  });

  const horaInicio = watch('horaInicio');
  const horaFin = watch('horaFin');
  const consumos = watch('consumos');
  const deudaMorchis = watch('deudaMorchis');
  const adelantoNomina = watch('adelantoNomina');

  useEffect(() => {
    if (isOpen) {
      reset({
        fecha: new Date(payroll.fecha).toISOString().split('T')[0],
        horaInicio: payroll.horaInicio,
        horaFin: payroll.horaFin,
        consumos: payroll.consumos,
        deudaMorchis: payroll.deudaMorchis,
        adelantoNomina: payroll.adelantoNomina,
        estado: payroll.estado,
        observaciones: payroll.observaciones || ''
      });
      setError(null);
    }
  }, [isOpen, payroll, reset]);

  useEffect(() => {
    calculateValues();
  }, [horaInicio, horaFin, consumos, deudaMorchis, adelantoNomina]);

  const calculateWorkTime = (horaInicio: string, horaFin: string) => {
    if (!horaInicio || !horaFin) return { horas: 0, minutos: 0 };
    
    const [inicioHora, inicioMinuto] = horaInicio.split(':').map(Number);
    const [finHora, finMinuto] = horaFin.split(':').map(Number);
    
    const inicioEnMinutos = inicioHora * 60 + inicioMinuto;
    let finEnMinutos = finHora * 60 + finMinuto;
    
    if (finEnMinutos < inicioEnMinutos) {
      finEnMinutos += 24 * 60;
    }
    
    const totalMinutos = finEnMinutos - inicioEnMinutos;
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    
    return { horas, minutos };
  };

  const calculateValues = useCallback(() => {
    if (!horaInicio || !horaFin) {
      return;
    }

    const { horas, minutos } = calculateWorkTime(horaInicio, horaFin);
    const totalHoras = horas + (minutos / 60);
    const salarioBruto = totalHoras * (payroll.employee?.salarioPorHora || 0);
    
    // Calcular subtotal de consumos (sin descuento)
    const subtotalConsumos = (consumos || []).reduce((sum: number, consumo: any) => sum + (consumo.valor || 0), 0);
    
    // Calcular descuento del 15% sobre los consumos
    const descuentoConsumos = subtotalConsumos * 0.15;
    const totalConsumos = subtotalConsumos - descuentoConsumos;
    
    const totalDescuentos = totalConsumos + (adelantoNomina || 0);
    const salarioNeto = salarioBruto - totalDescuentos + (deudaMorchis || 0);
    
    setCalculatedValues({
      horasTrabajadas: horas,
      minutosTrabajados: minutos,
      salarioBruto,
      subtotalConsumos,
      descuentoConsumos,
      totalConsumos,
      totalDescuentos,
      salarioNeto
    });
  }, [horaInicio, horaFin, consumos, deudaMorchis, adelantoNomina, payroll.employee?.salarioPorHora]);

  const onSubmit = async (data: EditPayrollFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await payrollService.update(payroll.id, {
        fecha: data.fecha,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        consumos: data.consumos,
        deudaMorchis: data.deudaMorchis,
        adelantoNomina: data.adelantoNomina,
        estado: data.estado,
        observaciones: data.observaciones
      });

      if (response.success) {
        success('Nómina actualizada exitosamente');
        onSuccess();
        onClose();
      } else {
        const errorMessage = response.error || 'Error al actualizar la nómina';
        showError(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
      const errorMessage = 'Error al actualizar la nómina';
      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addConsumo = () => {
    append({ valor: 0, descripcion: '' });
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Editar Nómina</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Información del empleado */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Empleado</h4>
            <div className="text-sm text-gray-700">
              <strong>{payroll.employee?.user?.nombre || 'N/A'} {payroll.employee?.user?.apellido || ''}</strong>
              <span className="ml-2">({payroll.employee?.user?.correo || 'Sin correo'})</span>
              <span className="ml-2">- {formatCurrency(payroll.employee?.salarioPorHora || 0)}/hora</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda - Datos básicos */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Información Básica</h4>
              
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha (YYYY/MM/DD) *
                </label>
                <Input
                  type="date"
                  {...register('fecha')}
                  disabled={isLoading}
                  placeholder="YYYY/MM/DD"
                />
                {errors.fecha && (
                  <p className="mt-1 text-sm text-red-600">{errors.fecha.message}</p>
                )}
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Inicio *
                  </label>
                  <Input
                    type="time"
                    {...register('horaInicio')}
                    disabled={isLoading}
                  />
                  {errors.horaInicio && (
                    <p className="mt-1 text-sm text-red-600">{errors.horaInicio.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Fin *
                  </label>
                  <Input
                    type="time"
                    {...register('horaFin')}
                    disabled={isLoading}
                  />
                  {errors.horaFin && (
                    <p className="mt-1 text-sm text-red-600">{errors.horaFin.message}</p>
                  )}
                </div>
              </div>

              {/* Estado - Solo para admins */}
              {!isEmployeeView && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <Select
                    {...register('estado')}
                    disabled={isLoading}
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PROCESADA">Procesada</option>
                    <option value="PAGADA">Pagada</option>
                  </Select>
                  {errors.estado && (
                    <p className="mt-1 text-sm text-red-600">{errors.estado.message}</p>
                  )}
                </div>
              )}

              {/* Deuda Morchis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deuda de Morchis al Empleado
                </label>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  {...register('deudaMorchis', { valueAsNumber: true })}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.deudaMorchis && (
                  <p className="mt-1 text-sm text-red-600">{errors.deudaMorchis.message}</p>
                )}
              </div>

              {/* Adelanto Nómina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adelanto de Nómina
                </label>
                <Input
                  type="number"
                  step="50"
                  min="0"
                  {...register('adelantoNomina', { valueAsNumber: true })}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.adelantoNomina && (
                  <p className="mt-1 text-sm text-red-600">{errors.adelantoNomina.message}</p>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  {...register('observaciones')}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Observaciones adicionales..."
                  disabled={isLoading}
                />
                {errors.observaciones && (
                  <p className="mt-1 text-sm text-red-600">{errors.observaciones.message}</p>
                )}
              </div>
            </div>

            {/* Columna derecha - Consumos y cálculos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">Consumos en el Local</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addConsumo}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>

              {/* Consumos */}
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {fields.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No hay consumos agregados</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addConsumo}
                      className="mt-2"
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar primer consumo
                    </Button>
                  </div>
                ) : (
                  fields.map((field, index) => (
                    <div key={field.id} className="flex mb-1 gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          className='focus:outline-none focus:ring-0 focus:border-gray-300'
                          type="number"
                          step="50"
                          min="0"
                          {...register(`consumos.${index}.valor`, { valueAsNumber: true })}
                          placeholder="Valor"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex-2">
                        <Input
                          className='focus:outline-none focus:ring-0 focus:border-gray-300'
                          {...register(`consumos.${index}.descripcion`)}
                          placeholder="Descripción"
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Cálculos automáticos */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center mb-3">
                  <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-blue-900">Cálculo Actualizado</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-800">Horas trabajadas:</span>
                    <span className="font-medium text-blue-900">
                      {calculatedValues.horasTrabajadas}h {calculatedValues.minutosTrabajados}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Salario bruto:</span>
                    <span className="font-medium text-blue-900">
                      {formatCurrency(calculatedValues.salarioBruto)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Consumo en el local:</span>
                    <span className="font-medium text-blue-900">
                      {formatCurrency(calculatedValues.subtotalConsumos)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Descuento del 15%:</span>
                    <span className="font-medium text-green-700">
                      -{formatCurrency(calculatedValues.descuentoConsumos)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Total consumos:</span>
                    <span className="font-medium text-blue-900">
                      -{formatCurrency(calculatedValues.totalConsumos)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Adelanto nómina:</span>
                    <span className="font-medium text-blue-900">
                      -{formatCurrency(watch('adelantoNomina') || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Deuda Morchis:</span>
                    <span className="font-medium text-blue-900">
                      +{formatCurrency(watch('deudaMorchis') || 0)}
                    </span>
                  </div>
                  <hr className="border-blue-300" />
                  <div className="flex justify-between">
                    <span className="text-blue-800 font-medium">Salario neto:</span>
                    <span className="font-bold text-blue-900 text-lg">
                      {formatCurrency(calculatedValues.salarioNeto)}
                    </span>
                  </div>
                </div>
              </div>
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
              {isLoading ? 'Actualizando...' : 'Actualizar Nómina'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
