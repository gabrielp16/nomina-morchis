import { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, User, CheckCircle, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { payrollService, employeeService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Payroll, Employee } from '../../types/auth';

interface PayrollPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PayrollsByEmployee {
  employee: Employee;
  payrolls: Payroll[];
}

interface QuincenaData {
  payrolls: Payroll[];
  total: number;
}

interface MonthlyData {
  primeraQuincena: QuincenaData;
  segundaQuincena: QuincenaData;
  totalMensual: number;
}

export function PayrollPaymentModal({ isOpen, onClose }: PayrollPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const { error: showError, success } = useToast();

  const handleConfirmarNomina = async (quincenaType: 'primera' | 'segunda') => {
    if (!selectedEmployee || !monthlyData) return;

    const payrollsToUpdate = quincenaType === 'primera' 
      ? monthlyData.primeraQuincena.payrolls 
      : monthlyData.segundaQuincena.payrolls;

    try {
      // Actualizar cada registro a estado "PAGADA"
      for (const payroll of payrollsToUpdate) {
        await payrollService.update(payroll.id, {
          estado: 'PAGADA'
        });
      }
      
      success(`Nómina de ${quincenaType} quincena confirmada exitosamente`);
      // Recargar datos para reflejar los cambios
      loadPayrollData();
    } catch (error) {
      console.error('Error confirming payroll:', error);
      showError('Error al confirmar nómina');
    }
  };

  const handleExportarPDF = (quincenaType: 'primera' | 'segunda') => {
    if (!selectedEmployee || !monthlyData) return;

    const employee = employees.find(e => e.id === selectedEmployee);
    const quincenaData = quincenaType === 'primera' 
      ? monthlyData.primeraQuincena 
      : monthlyData.segundaQuincena;

    // Crear contenido HTML para el PDF
    const htmlContent = generatePDFContent(
      employee, 
      quincenaData, 
      `${quincenaType === 'primera' ? 'Primera' : 'Segunda'} Quincena`,
      selectedMonth,
      selectedYear
    );

    // Abrir ventana de impresión con el contenido
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePDFContent = (
    employee: Employee | undefined,
    quincenaData: QuincenaData,
    quincenaTitle: string,
    month: string,
    year: string
  ) => {
    if (!employee) return '';

    const totales = quincenaData.payrolls.reduce((acc, payroll) => {
      const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
      const descuentoConsumos = subtotalConsumos * 0.15;
      const totalConsumos = subtotalConsumos - descuentoConsumos;
      const totalMinutos = (payroll.horasTrabajadas * 60) + payroll.minutosTrabajados;
      
      return {
        totalMinutos: acc.totalMinutos + totalMinutos,
        salarioBruto: acc.salarioBruto + payroll.salarioBruto,
        totalConsumos: acc.totalConsumos + totalConsumos,
        adelantos: acc.adelantos + payroll.adelantoNomina,
        descuadres: acc.descuadres + (payroll.descuadre || 0),
        deudas: acc.deudas + payroll.deudaMorchis,
        salarioNeto: acc.salarioNeto + (payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis)
      };
    }, {
      totalMinutos: 0,
      salarioBruto: 0,
      totalConsumos: 0,
      adelantos: 0,
      descuadres: 0,
      deudas: 0,
      salarioNeto: 0
    });

    const horasTotales = Math.floor(totales.totalMinutos / 60);
    const minutosTotales = totales.totalMinutos % 60;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nómina ${quincenaTitle} - ${employee.user?.nombre} ${employee.user?.apellido}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 10px; }
          h1 { color: #333; text-align: center; margin: 10px; font-size: 1.5em; }
          h2 { color: #666; margin: 0; text-align: center; font-size: 1.2em; font-weight: 100; }
          table { width: 100%; border-collapse: collapse; margin: 20px auto; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .green { color: #16a34a; }
          .red { color: #dc2626; }
          .periodo { color: #666; font-size: 1em; line-height: 1.5; padding: 4px; margin: 0; text-align: center; }
          .totals { background-color: #f9f9f9; font-weight: bold; }
          .data-field { font-size:12px; line-height: 1.5; padding: 4px;}
          .header-field { font-size:12px; line-height: 1.5; padding: 4px; text-align: center;}
          .footer-field { font-size:12px; line-height: 1.5; padding: 4px;}
        </style>
      </head>
      <body>
        <h1>Nómina ${quincenaTitle}</h1>
        <h2>Empleado: ${employee.user?.nombre} ${employee.user?.apellido}</h2>
        <p class="periodo">Período: ${getMonthName(month)} ${year}</p>

        <table>
          <thead>
            <tr>
              <th class="header-field">Día</th>
              <th class="header-field">Entrada</th>
              <th class="header-field">Salida</th>
              <th class="header-field">Horas</th>
              <th class="header-field">Valor horas</th>
              <th class="header-field">Consumos</th>
              <th class="header-field">Adelantos</th>
              <th class="header-field">Descuadre</th>
              <th class="header-field">Deudas Morchis</th>
              <th class="header-field">Salario</th>
            </tr>
          </thead>
          <tbody>
            ${quincenaData.payrolls.map(payroll => {
              const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
              const descuentoConsumos = subtotalConsumos * 0.15;
              const totalConsumos = subtotalConsumos - descuentoConsumos;
              
              return `
                <tr>
                  <td class="data-field text-center">${formatDay(payroll.fecha)}</td>
                  <td class="data-field text-right">${formatTime(payroll.horaInicio)}</td>
                  <td class="data-field text-right">${formatTime(payroll.horaFin)}</td>
                  <td class="data-field text-center">${payroll.horasTrabajadas}h ${payroll.minutosTrabajados}m</td>
                  <td class="text-right data-field">${formatCurrency(payroll.salarioBruto)}</td>
                  <td class="text-right data-field">${formatCurrency(totalConsumos)}</td>
                  <td class="text-right data-field">${formatCurrency(payroll.adelantoNomina)}</td>
                  <td class="text-right data-field">${formatCurrency(payroll.descuadre || 0)}</td>
                  <td class="text-right data-field">${formatCurrency(payroll.deudaMorchis)}</td>
                  <td class="text-right data-field">${formatCurrency(calculateDailyValue(payroll))}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot class="totals">
            <tr>
              <td class="footer-field" colspan="3">TOTALES:</td>
              <td class="footer-field text-center">${horasTotales}h ${minutosTotales}m</td>
              <td class="text-right green footer-field">${formatCurrency(totales.salarioBruto)}</td>
              <td class="text-right red footer-field">-${formatCurrency(totales.totalConsumos)}</td>
              <td class="text-right red footer-field">-${formatCurrency(totales.adelantos)}</td>
              <td class="text-right red footer-field">-${formatCurrency(totales.descuadres)}</td>
              <td class="text-right green footer-field">${formatCurrency(totales.deudas)}</td>
              <td class="text-right footer-field">${formatCurrency(totales.salarioNeto)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      // Set default month and year to current
      const now = new Date();
      setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
      setSelectedYear(now.getFullYear().toString());
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedEmployee && selectedMonth && selectedYear) {
      loadPayrollData();
    }
  }, [selectedEmployee, selectedMonth, selectedYear]);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAll(1, 100);
      if (response.success && response.data) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      showError('Error al cargar empleados');
    }
  };

  const loadPayrollData = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) return;

    setLoading(true);
    try {
      const startDate = `${selectedYear}-${selectedMonth}-01`;
      const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;

      const response = await payrollService.getAll(1, 100, {
        empleadoId: selectedEmployee,
        fechaInicio: startDate,
        fechaFin: endDate
      });

      if (response.success && response.data) {
        const payrolls = response.data.data;
        processMonthlyData(payrolls);
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
      showError('Error al cargar datos de nómina');
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (payrolls: Payroll[]) => {
    const primeraQuincenaPayrolls: Payroll[] = [];
    const segundaQuincenaPayrolls: Payroll[] = [];

    payrolls.forEach(payroll => {
      let day: number;
      
      // Convertir a string para verificar si es ISO
      const fechaStr = String(payroll.fecha);
      
      if (fechaStr.includes('T') || fechaStr.includes('Z')) {
        // Es un string ISO, extraer el día directamente
        const datePart = fechaStr.split('T')[0];
        day = parseInt(datePart.split('-')[2], 10);
      } else {
        day = new Date(payroll.fecha).getDate();
      }
      
      if (day <= 15) {
        primeraQuincenaPayrolls.push(payroll);
      } else {
        segundaQuincenaPayrolls.push(payroll);
      }
    });

    const calculateTotal = (payrollList: Payroll[]) => {
      return payrollList.reduce((sum, payroll) => {
        const subtotalConsumos = payroll.consumos.reduce((s, c) => s + c.valor, 0);
        const descuentoConsumos = subtotalConsumos * 0.15;
        const totalConsumos = subtotalConsumos - descuentoConsumos;
        return sum + (payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis);
      }, 0);
    };

    const primeraQuincenaTotal = calculateTotal(primeraQuincenaPayrolls);
    const segundaQuincenaTotal = calculateTotal(segundaQuincenaPayrolls);

    setMonthlyData({
      primeraQuincena: {
        payrolls: primeraQuincenaPayrolls,
        total: primeraQuincenaTotal
      },
      segundaQuincena: {
        payrolls: segundaQuincenaPayrolls,
        total: segundaQuincenaTotal
      },
      totalMensual: primeraQuincenaTotal + segundaQuincenaTotal
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDay = (date: string | Date) => {
    const dateStr = String(date);
    
    if (dateStr.includes('T') || dateStr.includes('Z')) {
      // Es un string ISO, extraer el día directamente para evitar conversión de timezone
      const datePart = dateStr.split('T')[0];
      const day = datePart.split('-')[2];
      return day;
    }
    
    const d = new Date(date);
    return d.getDate().toString().padStart(2, '0');
  };

  const calculateDailyValue = (payroll: Payroll) => {
    const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
    const descuentoConsumos = subtotalConsumos * 0.15;
    const totalConsumos = subtotalConsumos - descuentoConsumos;
    return payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis;
  };

  const getMonthName = (month: string) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[parseInt(month) - 1];
  };

  const generateMonthOptions = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const month = i.toString().padStart(2, '0');
      months.push(
        <option key={month} value={month}>
          {getMonthName(month)}
        </option>
      );
    }
    return months;
  };

  const generateYearOptions = () => {
    const currentYear = 2025;
    const years = [];
    for (let i = currentYear; i <= currentYear + 10; i++) {
      years.push(
        <option key={i} value={i.toString()}>
          {i}
        </option>
      );
    }
    return years;
  };

  const renderQuincenaTable = (title: string, quincenaData: QuincenaData, quincenaType: 'primera' | 'segunda') => {
    // Calcular totales por columna
    const totales = quincenaData.payrolls.reduce((acc, payroll) => {
      const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
      const descuentoConsumos = subtotalConsumos * 0.15;
      const totalConsumos = subtotalConsumos - descuentoConsumos;
      
      // Convertir horas y minutos a minutos totales para la suma
      const totalMinutos = (payroll.horasTrabajadas * 60) + payroll.minutosTrabajados;
      
      return {
        totalMinutos: acc.totalMinutos + totalMinutos,
        salarioBruto: acc.salarioBruto + payroll.salarioBruto,
        totalConsumos: acc.totalConsumos + totalConsumos,
        adelantos: acc.adelantos + payroll.adelantoNomina,
        descuadres: acc.descuadres + (payroll.descuadre || 0),
        deudas: acc.deudas + payroll.deudaMorchis,
        salarioNeto: acc.salarioNeto + (payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis)
      };
    }, {
      totalMinutos: 0,
      salarioBruto: 0,
      totalConsumos: 0,
      adelantos: 0,
      descuadres: 0,
      deudas: 0,
      salarioNeto: 0
    });

    // Convertir minutos totales de vuelta a horas y minutos
    const horasTotales = Math.floor(totales.totalMinutos / 60);
    const minutosTotales = totales.totalMinutos % 60;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">{title}</h4>
          <div className="flex space-x-3">
            <Button
              onClick={() => handleConfirmarNomina(quincenaType)}
              variant="outline"
              size="sm"
              className="inline-flex items-center"
              disabled={quincenaData.payrolls.length === 0 || quincenaData.payrolls.every(p => p.estado === 'PAGADA')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Nómina
            </Button>
            <Button
              onClick={() => handleExportarPDF(quincenaType)}
              variant="outline"
              size="sm"
              className="inline-flex items-center"
              disabled={quincenaData.payrolls.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Día
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrada
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salida
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor horas
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumos
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adelantos
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuadre
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deudas Morchis
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salario
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quincenaData.payrolls.map((payroll) => {
                const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
                const descuentoConsumos = subtotalConsumos * 0.15;
                const totalConsumos = subtotalConsumos - descuentoConsumos;
                
                return (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900">
                      {formatDay(payroll.fecha)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                      {formatTime(payroll.horaInicio)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                      {formatTime(payroll.horaFin)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                      {payroll.horasTrabajadas}h {payroll.minutosTrabajados}m
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(payroll.salarioBruto)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(totalConsumos)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(payroll.adelantoNomina)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(payroll.descuadre || 0)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(payroll.deudaMorchis)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                      {formatCurrency(calculateDailyValue(payroll))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={3} className="px-2 py-3 text-sm font-semibold text-gray-900">
                  
                </td>
                <td className="px-2 py-3 text-sm font-bold text-gray-900">
                  {horasTotales}h {minutosTotales}m
                </td>
                <td className="px-2 py-3 text-sm font-bold text-green-600 text-right">
                  {formatCurrency(totales.salarioBruto)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-red-600 text-right">
                  -{formatCurrency(totales.totalConsumos)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-red-600 text-right">
                  -{formatCurrency(totales.adelantos)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-red-600 text-right">
                  -{formatCurrency(totales.descuadres)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-green-600 text-right">
                  {formatCurrency(totales.deudas)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totales.salarioNeto)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40 transition-opacity opacity-100 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Pagar Nómina - Resumen Mensual
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empleado
              </label>
              <Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Seleccionar empleado</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.user?.nombre} {employee.user?.apellido}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {generateMonthOptions()}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
              </label>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {generateYearOptions()}
              </Select>
            </div>
          </div>

          {/* Contenido principal */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Cargando datos...</span>
            </div>
          ) : selectedEmployee && monthlyData ? (
            <div>
              {/* Header con información del empleado y mes */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-6 w-6 text-green-600 mr-2" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">
                        {employees.find(e => e.id === selectedEmployee)?.user?.nombre}{' '}
                        {employees.find(e => e.id === selectedEmployee)?.user?.apellido}
                      </h3>
                      <p className="text-sm text-green-700">
                        Resumen de {getMonthName(selectedMonth)} {selectedYear}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-700">Total Mensual</div>
                    <div className="text-xl font-bold text-green-900">
                      {formatCurrency(monthlyData.totalMensual)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tablas por quincena */}
              {renderQuincenaTable("Primera Quincena", monthlyData.primeraQuincena, 'primera')}
              {renderQuincenaTable("Segunda Quincena", monthlyData.segundaQuincena, 'segunda')}
            </div>
          ) : selectedEmployee ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay registros para este período
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron registros de nómina para {getMonthName(selectedMonth)} {selectedYear}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Selecciona un empleado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona un empleado para ver su resumen de nómina
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
