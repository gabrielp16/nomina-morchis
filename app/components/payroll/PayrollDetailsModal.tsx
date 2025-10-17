import { useState } from 'react';
import { X, User, Clock, DollarSign, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import type { Payroll } from '../../types/auth';

interface PayrollDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: Payroll;
}

export function PayrollDetailsModal({ isOpen, onClose, payroll }: PayrollDetailsModalProps) {
  const [isConsumosCollapsed, setIsConsumosCollapsed] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Función específica para formatear el Total (salario neto) redondeado hacia arriba a la quinta decena
  const formatTotal = (value: number) => {
    const roundedValue = Math.ceil(value / 50) * 50;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(roundedValue);
  };

  // Calcular subtotal real sumando los consumos individuales
  const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
  const descuentoConsumos = subtotalConsumos * 0.15;
  const totalConsumosCalculado = subtotalConsumos - descuentoConsumos;
  
  // Calcular salario neto para verificación
  const salarioNetoCalculado = payroll.salarioBruto - totalConsumosCalculado - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis;

  const formatTime = (time: string) => {
    if (!time) return '';
    
    // Parse the time string (assuming HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (dateInput: string | Date) => {
    if (typeof dateInput === 'string' && (dateInput.includes('T') || dateInput.includes('Z'))) {
      // Es un string ISO, parsear directamente para evitar conversión de timezone
      const dateParts = dateInput.split('T')[0].split('-');
      return `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`;
    }
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const formatDateTime = (dateInput: string | Date) => {
    if (typeof dateInput === 'string' && (dateInput.includes('T') || dateInput.includes('Z'))) {
      // Para timestamps ISO, usar Date para mantener la hora correcta
      const date = new Date(dateInput);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    }
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
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
    <div className="fixed inset-0 bg-black/50 z-40 transition-opacity opacity-100 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
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
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0">
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="text-lg font-medium text-gray-900 truncate">
                    {payroll.employee?.user?.nombre || 'Empleado'} {payroll.employee?.user?.apellido || 'Desactivado'}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {payroll.employee?.user?.correo || 'Empleado desactivado'}
                  </div>
                </div>
              </div>
              <div className="flex justify-start sm:justify-end">
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
                    {formatDate(payroll.fecha)}
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
                <hr className="border-gray-300" />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Consumo en el local:</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(subtotalConsumos)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">Descuento 15%:</span>
                  <span className="text-sm font-medium text-green-600">
                    -{formatCurrency(descuentoConsumos)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total consumos:</span>
                  <span className="text-sm font-medium text-red-600">
                    -{formatCurrency(totalConsumosCalculado)}
                  </span>
                </div>                
                <hr className="border-gray-300" />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Adelanto nómina:</span>
                  <span className="text-sm font-medium text-red-600">
                    -{formatCurrency(payroll.adelantoNomina)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Descuadre:</span>
                  <span className="text-sm font-medium text-red-600">
                    -{formatCurrency(payroll.descuadre || 0)}
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
                    {formatTotal(salarioNetoCalculado)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Consumos detallados */}
          {payroll.consumos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div 
                className="flex items-center justify-between cursor-pointer mb-3"
                onClick={() => setIsConsumosCollapsed(!isConsumosCollapsed)}
              >
                <h4 className="text-md font-medium text-gray-900 flex items-center">
                  Consumos en el Local
                  <span className="ml-2 text-sm text-gray-500">
                    ({payroll.consumos.length} {payroll.consumos.length === 1 ? 'item' : 'items'})
                  </span>
                </h4>
                <div className="flex items-center text-gray-500 hover:text-gray-700">
                  {isConsumosCollapsed ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronUp className="h-5 w-5" />
                  )}
                </div>
              </div>
              
              {!isConsumosCollapsed && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="space-y-2">
                    {payroll.consumos.map((consumo, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{consumo.descripcion}</span>
                        <span className="text-sm font-medium">{formatCurrency(consumo.valor)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <span className="text-sm text-gray-700">Subtotal:</span>
                      <span className="text-sm text-gray-900">{formatCurrency(subtotalConsumos)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm">Descuento del 15%:</span>
                      <span className="text-sm">-{formatCurrency(descuentoConsumos)}</span>
                    </div>
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-sm text-gray-900">Total:</span>
                      <span className="text-sm text-gray-900">{formatCurrency(totalConsumosCalculado)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {isConsumosCollapsed && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Total consumos con descuento:</span>
                    <span className="font-medium">{formatCurrency(totalConsumosCalculado)}</span>
                  </div>
                </div>
              )}
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
                <span className="font-medium">Procesado por:</span> {
                  payroll.procesadoPor 
                    ? `${payroll.procesadoPor.nombre} ${payroll.procesadoPor.apellido}` 
                    : 'Sistema'
                }
              </div>
              <div>
                <span className="font-medium">Fecha de creación:</span> {formatDateTime(payroll.createdAt)}
              </div>
              {payroll.updatedAt !== payroll.createdAt && (
                <div>
                  <span className="font-medium">Última actualización:</span> {formatDateTime(payroll.updatedAt)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-300">
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
