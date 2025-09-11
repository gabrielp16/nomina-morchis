import { useState, useEffect, type ChangeEvent } from 'react';
import { Search, Edit, Trash2, Calendar, ChevronDown, ChevronRight, Eye, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useEmployee } from '../context/EmployeeContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { payrollService, employeeService } from '../services/api';
import type { Payroll, Employee } from '../types/auth';
import { EditPayrollModal } from '../components/payroll/EditPayrollModal';
import { PayrollDetailsModal } from '../components/payroll/PayrollDetailsModal';
import { PayrollPaymentModal } from '../components/payroll/PayrollPaymentModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function PayrollDetailsPage() {
  const { hasPermission } = useAuth();
  const { isAdmin, isEmployee, currentEmployee } = useEmployee();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    empleadoId: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [collapsedFortnights, setCollapsedFortnights] = useState<Set<string>>(new Set());
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isAdmin) {
      Promise.all([loadPayrolls(), loadEmployees()]);
    } else if (isEmployee) {
      loadPayrolls();
    }
  }, [search, filters, isAdmin, isEmployee]);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const response = await payrollService.getAll(1, 1000, {
        search,
        ...filters
      });
      if (response.success && response.data) {
        setPayrolls(response.data.data);
      }
    } catch (error) {
      console.error('Error loading payrolls:', error);
      showError('Error al cargar nóminas');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!isAdmin) return;
    
    try {
      const response = await employeeService.getAll(1, 100);
      if (response.success && response.data) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleDelete = async (payroll: Payroll) => {
    if (payroll.estado !== 'PENDIENTE') {
      showError('Solo se pueden eliminar nóminas en estado PENDIENTE');
      return;
    }

    const result = await confirm({
      title: '¿Estás seguro?',
      message: `¿Deseas eliminar la nómina del ${formatDate(payroll.fecha)} para ${payroll.employee?.user?.nombre || 'Usuario'} ${payroll.employee?.user?.apellido || ''}?`
    });

    if (result) {
      try {
        const response = await payrollService.delete(payroll.id);
        if (response.success) {
          success('Nómina eliminada exitosamente');
          loadPayrolls();
        } else {
          showError(response.error || 'Error al eliminar nómina');
        }
      } catch (error) {
        console.error('Error deleting payroll:', error);
        showError('Error al eliminar nómina');
      }
    }
  };

  const handleEdit = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setShowEditModal(true);
  };

  const handleViewDetails = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailsModal(true);
  };

  const handleModalSuccess = () => {
    loadPayrolls();
    setShowEditModal(false);
    setShowDetailsModal(false);
    setSelectedPayroll(null);
  };

  const handleEditById = (payrollId: string) => {
    const payroll = payrolls.find(p => p.id === payrollId);
    if (payroll) {
      handleEdit(payroll);
    }
  };

  const handleDeleteById = (payrollId: string) => {
    const payroll = payrolls.find(p => p.id === payrollId);
    if (payroll) {
      handleDelete(payroll);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Función para redondear hacia arriba a la quinta decima (50)
  const roundUpToFifty = (value: number) => {
    return Math.ceil(value / 50) * 50;
  };

  // Función auxiliar para manejar fechas en zona horaria de Colombia (UTC-5)
  const formatDateColombia = (date: Date | string) => {
    if (!date) return '';
    
    let targetDate: Date;
    
    if (typeof date === 'string') {
      // Si viene como string, parsearlo como fecha local sin conversión de zona horaria
      if (date.includes('T') || date.includes('Z')) {
        // Para fechas ISO, extraer solo la parte de la fecha
        const datePart = date.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        targetDate = new Date(year, month - 1, day);
      } else {
        // Para fechas en formato YYYY-MM-DD
        const [year, month, day] = date.split('-').map(Number);
        targetDate = new Date(year, month - 1, day);
      }
    } else {
      // Si es un objeto Date, crear una nueva fecha local para evitar problemas de zona horaria
      targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    
    return targetDate.toLocaleDateString('es-CO');
  };

  // Función auxiliar para obtener día, mes y año de una fecha sin problemas de zona horaria
  const getLocalDateParts = (date: Date | string) => {
    if (!date) return { year: 0, month: 0, day: 0 };
    
    let year: number, month: number, day: number;
    
    if (typeof date === 'string') {
      if (date.includes('T') || date.includes('Z')) {
        const datePart = date.split('T')[0];
        const parts = datePart.split('-').map(Number);
        year = parts[0];
        month = parts[1] - 1; // JavaScript months are 0-based
        day = parts[2];
      } else {
        const parts = date.split('-').map(Number);
        year = parts[0];
        month = parts[1] - 1;
        day = parts[2];
      }
    } else {
      // Si es Date, usar UTC para evitar problemas de zona horaria
      year = date.getUTCFullYear();
      month = date.getUTCMonth();
      day = date.getUTCDate();
    }
    
    return { year, month, day };
  };

  // Función auxiliar para obtener solo el día de una fecha
  const getDayOnly = (date: Date | string) => {
    const { day } = getLocalDateParts(date);
    return day.toString().padStart(2, '0');
  };

  // Función auxiliar para formatear las horas trabajadas
  const formatWorkedTime = (hours: number, minutes: number) => {
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Función para calcular el total de consumos
  const calculateTotalConsumos = (payroll: Payroll) => {
    if (!payroll.consumos || payroll.consumos.length === 0) return 0;
    const subtotal = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
    const descuento = subtotal * 0.15; // 15% de descuento
    return subtotal - descuento;
  };

  // Función para calcular el salario neto correcto en tiempo real
  const calculateCorrectSalarioNeto = (payroll: Payroll) => {
    // Calcular subtotal real de consumos sumando los consumos individuales
    const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
    
    // Calcular descuento del 15% sobre los consumos
    const descuentoConsumos = subtotalConsumos * 0.15;
    const totalConsumos = subtotalConsumos - descuentoConsumos;
    
    // Calcular salario neto: salario bruto - total consumos - adelanto - descuadre + deuda
    const salarioNeto = payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis;
    
    return salarioNeto;
  };

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
    if (typeof dateInput === 'string') {
      // Si es un string ISO, extraer la fecha directamente sin conversión de zona horaria
      if (dateInput.includes('T') || dateInput.includes('Z')) {
        // Para fechas ISO como "2025-09-01T00:00:00.000Z"
        const datePart = dateInput.split('T')[0];
        const [year, month, day] = datePart.split('-');
        return `${year}/${month}/${day}`;
      } else {
        // Para fechas en formato "YYYY-MM-DD"
        const [year, month, day] = dateInput.split('-');
        return `${year}/${month}/${day}`;
      }
    }
    
    // Si es un objeto Date, usar el método anterior
    const date = dateInput;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // Función para formatear solo el día (para usar en acordeones)
  const formatDay = (dateInput: string | Date) => {
    if (typeof dateInput === 'string') {
      // Si es un string ISO, extraer solo el día
      if (dateInput.includes('T') || dateInput.includes('Z')) {
        // Para fechas ISO como "2025-09-01T00:00:00.000Z"
        const datePart = dateInput.split('T')[0];
        const [, , day] = datePart.split('-');
        return parseInt(day).toString(); // Remover ceros a la izquierda
      } else {
        // Para fechas en formato "YYYY-MM-DD"
        const [, , day] = dateInput.split('-');
        return parseInt(day).toString(); // Remover ceros a la izquierda
      }
    }
    
    // Si es un objeto Date
    const date = dateInput;
    return date.getDate().toString();
  };

  const getEstadoBadge = (estado: 'PENDIENTE' | 'PROCESADA' | 'PAGADA') => {
    const badges = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      PROCESADA: 'bg-blue-100 text-blue-800',
      PAGADA: 'bg-green-100 text-green-800'
    };
    return badges[estado];
  };

  const clearFilters = () => {
    setFilters({
      estado: '',
      empleadoId: '',
      fechaInicio: '',
      fechaFin: ''
    });
    setSearch('');
  };

  // Función para agrupar payrolls por mes y año con cálculos de totales
  const groupPayrollsByMonthAndFortnight = (payrolls: Payroll[]) => {
    const monthGroups: { [monthKey: string]: { [fortnightKey: string]: Payroll[] } } = {};
    
    payrolls.forEach(payroll => {
      // Usar la función auxiliar para obtener las partes de la fecha sin problemas de zona horaria
      const { year, month, day } = getLocalDateParts(payroll.fecha);
      
      const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      const fortnight = day <= 15 ? 'primera' : 'segunda';
      
      // Inicializar estructuras si no existen
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {};
      }
      if (!monthGroups[monthKey][fortnight]) {
        monthGroups[monthKey][fortnight] = [];
      }
      
      monthGroups[monthKey][fortnight].push(payroll);
    });

    // Ordenar grupos por fecha (más reciente primero)
    const sortedMonthKeys = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
    
    return sortedMonthKeys.map(monthKey => {
      const fortnights = monthGroups[monthKey];
      const sortedFortnights = Object.keys(fortnights).sort((a, b) => {
        // Ordenar quincenas: primera antes que segunda
        if (a === 'primera' && b === 'segunda') return -1;
        if (a === 'segunda' && b === 'primera') return 1;
        return 0;
      });

      const allPayrolls = Object.values(fortnights).flat();

      return {
        monthKey,
        monthYear: formatMonthYear(monthKey),
        fortnights: sortedFortnights.map(fortnightKey => {
          const fortnightPayrolls = fortnights[fortnightKey].sort((a, b) => {
            // Ordenar por fecha dentro del grupo
            const dateA = new Date(a.fecha);
            const dateB = new Date(b.fecha);
            return dateB.getTime() - dateA.getTime();
          });

          // Agrupar por empleado dentro de la quincena
          const employeeGroups: { [employeeId: string]: { employee: any; payrolls: Payroll[]; total: number } } = {};
          
          fortnightPayrolls.forEach(payroll => {
            const employeeId = payroll.employee?.id || 'unknown';
            if (!employeeGroups[employeeId]) {
              employeeGroups[employeeId] = {
                employee: payroll.employee,
                payrolls: [],
                total: 0
              };
            }
            employeeGroups[employeeId].payrolls.push(payroll);
            employeeGroups[employeeId].total += calculateCorrectSalarioNeto(payroll);
          });

          // Redondear los totales de cada empleado
          Object.values(employeeGroups).forEach(group => {
            group.total = group.total;
          });

          const fortnightTotal = fortnightPayrolls.reduce((sum, p) => sum + calculateCorrectSalarioNeto(p), 0);

          return {
            fortnightKey: `${monthKey}-${fortnightKey}`,
            fortnightName: fortnightKey === 'primera' ? 'Primera Quincena' : 'Segunda Quincena',
            payrolls: fortnightPayrolls,
            employeeGroups: Object.values(employeeGroups),
            total: fortnightTotal
          };
        }),
        // Totales del mes completo
        totalEarnings: allPayrolls.reduce((sum, p) => sum + calculateCorrectSalarioNeto(p), 0)
      };
    });
  };

  // Función para formatear la etiqueta de quincena
  const formatFortnightLabel = (key: string) => {
    const [year, month, fortnight] = key.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const fortnightName = fortnight === 'primera' ? 'Primera Quincena' : 'Segunda Quincena';
    return `${fortnightName} - ${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Función para formatear el mes y año
  const formatMonthYear = (key: string) => {
    const [year, month] = key.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Función para obtener la clave del mes actual
  const getCurrentMonthKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // getMonth() ya devuelve 0-11
    return `${year}-${month.toString().padStart(2, '0')}`;
  };

  // Función para alternar el estado de colapso de un mes
  const toggleMonthCollapse = (monthKey: string) => {
    const newCollapsed = new Set(collapsedMonths);
    if (newCollapsed.has(monthKey)) {
      newCollapsed.delete(monthKey);
    } else {
      newCollapsed.add(monthKey);
    }
    setCollapsedMonths(newCollapsed);
  };

  // Función para alternar el estado de colapso de una quincena
  const toggleFortnightCollapse = (fortnightKey: string) => {
    const newCollapsed = new Set(collapsedFortnights);
    if (newCollapsed.has(fortnightKey)) {
      newCollapsed.delete(fortnightKey);
    } else {
      newCollapsed.add(fortnightKey);
    }
    setCollapsedFortnights(newCollapsed);
  };

  // Inicializar grupos colapsados (todos excepto el mes actual)
  useEffect(() => {
    if (payrolls.length > 0) {
      const currentMonthKey = getCurrentMonthKey();
      const groups = groupPayrollsByMonthAndFortnight(payrolls);
      const initialCollapsed = new Set<string>();
      
      groups.forEach(group => {
        if (group.monthKey !== currentMonthKey) {
          initialCollapsed.add(group.monthKey);
        }
      });
      
      setCollapsedMonths(initialCollapsed);
    }
  }, [payrolls.length > 0 ? payrolls[0]?.id : null]); // Solo cuando cambian los payrolls

  return (
    <ProtectedRoute requiredPermissions={["READ_PAYROLL"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  {isAdmin ? 'Detalle de Nómina' : 'Detalle de Mi Nómina'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isAdmin 
                    ? 'Vista detallada de todos los registros de nómina con información completa' 
                    : `Vista detallada de tus registros de trabajo y consumos - ${currentEmployee?.user.nombre} ${currentEmployee?.user.apellido}`
                  }
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 md:ml-4 flex space-x-3">
                {isAdmin && hasPermission("PAY_PAYROLL") && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Pagar Nóminas</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className={`grid gap-4 ${isAdmin ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
                {isAdmin && (
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Buscar por empleado..."
                        value={search}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Select
                    value={filters.estado}
                    onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PROCESADA">Procesada</option>
                    <option value="PAGADA">Pagada</option>
                  </Select>
                </div>

                {isAdmin && (
                  <div>
                    <Select
                      value={filters.empleadoId}
                      onChange={(e) => setFilters(prev => ({ ...prev, empleadoId: e.target.value }))}
                    >
                      <option value="">Todos los empleados</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.user?.nombre || 'Usuario'} {employee.user?.apellido || ''}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha desde
                  </label>
                  <Input
                    type="date"
                    value={filters.fechaInicio}
                    onChange={(e) => setFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha hasta
                  </label>
                  <Input
                    type="date"
                    value={filters.fechaFin}
                    onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Payrolls Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : payrolls.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {isAdmin ? 'No hay nóminas' : 'No tienes registros'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {search || Object.values(filters).some(v => v) 
                        ? 'No se encontraron registros que coincidan con los filtros.' 
                        : isAdmin 
                          ? 'No hay registros de nómina disponibles.' 
                          : 'No tienes registros de trabajo disponibles.'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Vista por acordeones agrupados por mes/año para todos los usuarios */}
                    <div className="space-y-4">
                      {groupPayrollsByMonthAndFortnight(payrolls).map((monthGroup) => (
                        <div key={monthGroup.monthKey} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                          {/* Header del acordeón mensual */}
                          <button
                            onClick={() => toggleMonthCollapse(monthGroup.monthKey)}
                            className="w-full px-4 py-1 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center">
                                {collapsedMonths.has(monthGroup.monthKey) ? (
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <div className="text-left">
                                  <h2 className="text-lg font-bold text-gray-900">{monthGroup.monthYear}</h2>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-600">
                                {formatCurrency(roundUpToFifty(monthGroup.totalEarnings))}
                              </div>
                              <p className="text-xs text-gray-500">Total del mes</p>
                            </div>
                          </button>

                          {/* Contenido del acordeón del mes - Quincenas */}
                          {!collapsedMonths.has(monthGroup.monthKey) && (
                            <div className="border-t border-gray-200 bg-gray-50">
                              {monthGroup.fortnights.map((fortnightGroup) => (
                                <div key={fortnightGroup.fortnightKey} 
                                     className="border-b border-gray-200 last:border-b-0">
                                  
                                  {/* Header del Acordeón de Quincena */}
                                  <button
                                    onClick={() => toggleFortnightCollapse(fortnightGroup.fortnightKey)}
                                    className="w-full flex items-center justify-between px-8 py-1 text-left hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center">
                                        {collapsedFortnights.has(fortnightGroup.fortnightKey) ? (
                                          <ChevronRight className="h-3 w-3 text-gray-400" />
                                        ) : (
                                          <ChevronDown className="h-3 w-3 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="text-left">
                                          <h3 className="text-sm font-semibold text-gray-900">
                                            {fortnightGroup.fortnightName}
                                          </h3>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-blue-600">
                                        {formatCurrency(roundUpToFifty(fortnightGroup.total))}
                                      </div>
                                      <p className="text-xs text-gray-500">Total quincena</p>
                                    </div>
                                  </button>

                                  {/* Contenido del Acordeón de Quincena - Empleados */}
                                  {!collapsedFortnights.has(fortnightGroup.fortnightKey) && (
                                    <div className="border-t border-gray-300 bg-white">
                                      
                                      {/* Lista de empleados y sus totales por quincena */}
                                      <div className="divide-y divide-gray-200">
                                        {fortnightGroup.employeeGroups.map((employeeGroup, index) => (
                                          <div key={employeeGroup.employee?.id || index} 
                                               className="px-8 py-3 hover:bg-gray-50 transition-colors">
                                            
                                            {/* Resumen del empleado */}
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-3 px-8">
                                                <div>
                                                  <h4 className="text-sm font-semibold text-gray-900">
                                                    {employeeGroup.employee?.user?.nombre} {employeeGroup.employee?.user?.apellido}
                                                  </h4>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-md">
                                                  {formatCurrency(roundUpToFifty(employeeGroup.total))}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && selectedPayroll && (
        <EditPayrollModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleModalSuccess}
          payroll={selectedPayroll}
          isEmployeeView={!isAdmin}
        />
      )}

      {showDetailsModal && selectedPayroll && (
        <PayrollDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          payroll={selectedPayroll}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PayrollPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </ProtectedRoute>
  );
}
