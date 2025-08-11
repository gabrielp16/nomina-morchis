import { X, User, Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import type { Payroll } from '../../types/auth';

interface PayrollDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: Payroll;
}

export function PayrollDetailsModal({ isOpen, onClose, payroll }: PayrollDetailsModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getEstadoBadge = (estado: 'PENDIENTE' | 'PROCESADA' | 'PAGADA') => {
    const badges = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      PROCESADA: 'bg-blue-100 text-blue-800',
      PAGADA: 'bg-green-100 text-green-800'
    };
    return badges[estado];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Detalles de Nómina</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Información del empleado */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-lg font-medium text-gray-900">
                  {payroll.employee.user.nombre} {payroll.employee.user.apellido}
                </div>
                <div className="text-sm text-gray-500">{payroll.employee.user.correo}</div>
                <div className="text-sm text-gray-500">
                  Salario por hora: {formatCurrency(payroll.employee.salarioPorHora)}
                </div>
              </div>
              <div className="ml-auto">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getEstadoBadge(payroll.estado)}`}>
                  {payroll.estado}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información de trabajo */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Información de Trabajo
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fecha:</span>
                  <span className="text-sm font-medium">
                    {new Date(payroll.fecha).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Hora inicio:</span>
                  <span className="text-sm font-medium">{formatTime(payroll.horaInicio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Hora fin:</span>
                  <span className="text-sm font-medium">{formatTime(payroll.horaFin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tiempo trabajado:</span>
                  <span className="text-sm font-medium">
                    {payroll.horasTrabajadas}h {payroll.minutosTrabajados}m
                  </span>
                </div>
              </div>
            </div>

            {/* Cálculos salariales */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Cálculos Salariales
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Salario bruto:</span>
                  <span className="text-sm font-medium">{formatCurrency(payroll.salarioBruto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total consumos:</span>
                  <span className="text-sm font-medium text-red-600">
                    -{formatCurrency(payroll.totalConsumos)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Adelanto nómina:</span>
                  <span className="text-sm font-medium text-red-600">
                    -{formatCurrency(payroll.adelantoNomina)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Deuda Morchis:</span>
                  <span className="text-sm font-medium text-green-600">
                    +{formatCurrency(payroll.deudaMorchis)}
                  </span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Salario neto:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(payroll.salarioNeto)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Consumos detallados */}
          {payroll.consumos.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Consumos en el Local</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="space-y-2">
                  {payroll.consumos.map((consumo, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <span className="text-sm text-gray-700">{consumo.descripcion}</span>
                      <span className="text-sm font-medium">{formatCurrency(consumo.valor)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-medium">
                    <span className="text-sm text-gray-900">Total:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(payroll.totalConsumos)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {payroll.observaciones && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Observaciones
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-sm text-gray-700">{payroll.observaciones}</p>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Procesado por:</span> {payroll.procesadoPor.nombre} {payroll.procesadoPor.apellido}
              </div>
              <div>
                <span className="font-medium">Fecha de creación:</span> {new Date(payroll.createdAt).toLocaleString('es-ES')}
              </div>
              {payroll.updatedAt !== payroll.createdAt && (
                <div>
                  <span className="font-medium">Última actualización:</span> {new Date(payroll.updatedAt).toLocaleString('es-ES')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
