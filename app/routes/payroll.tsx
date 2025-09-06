import { useState, useEffect, type ChangeEvent } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, ChevronDown, ChevronRight, Eye } from 'lucide-react';
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
import { CreatePayrollModal } from '../components/payroll/CreatePayrollModal';
import { EditPayrollModal } from '../components/payroll/EditPayrollModal';
import { PayrollDetailsModal } from '../components/payroll/PayrollDetailsModal';
import { PayrollPaymentModal } from '../components/payroll/PayrollPaymentModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function PayrollPage() {
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [collapsedFortnights, setCollapsedFortnights] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isAdmin) {
      Promise.all([loadPayrolls(), loadEmployees()]);
    } else if (isEmployee) {
      loadPayrolls();
    }
  }, [search, filters, isAdmin, isEmployee]);

  // useEffect para inicializar los estados de colapso cuando cambian los payrolls
  useEffect(() => {
    if (payrolls.length > 0 && !isInitialized) {
      const { collapsedMonths: newCollapsedMonths, collapsedFortnights: newCollapsedFortnights } = 
        initializeCollapsedStates(payrolls);
      
      setCollapsedMonths(newCollapsedMonths);
      setCollapsedFortnights(newCollapsedFortnights);
      setIsInitialized(true);
    }
  }, [payrolls, isInitialized]);

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
    setShowCreateModal(false);
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

  const handleViewDetailsById = (payrollId: string) => {
    const payroll = payrolls.find(p => p.id === payrollId);
    if (payroll) {
      handleViewDetails(payroll);
    }
  };

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

  const formatDate = (dateInput: string | Date) => {
    if (typeof dateInput === 'string') {
      if (dateInput.includes('T') || dateInput.includes('Z')) {
        const datePart = dateInput.split('T')[0];
        const [year, month, day] = datePart.split('-');
        return `${year}/${month}/${day}`;
      } else {
        const [year, month, day] = dateInput.split('-');
        return `${year}/${month}/${day}`;
      }
    }
    
    const date = dateInput;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // Función para obtener solo el día de una fecha
  const getDayOnly = (dateInput: string | Date) => {
    if (typeof dateInput === 'string') {
      if (dateInput.includes('T') || dateInput.includes('Z')) {
        const datePart = dateInput.split('T')[0];
        const [, , day] = datePart.split('-');
        return parseInt(day).toString();
      } else {
        const [, , day] = dateInput.split('-');
        return parseInt(day).toString();
      }
    }
    
    const date = dateInput;
    return date.getDate().toString();
  };

  // Función para calcular el total de consumos
  const calculateTotalConsumos = (payroll: Payroll) => {
    if (!payroll.consumos || payroll.consumos.length === 0) return 0;
    const subtotal = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
    const descuento = subtotal * 0.15; // 15% de descuento
    return subtotal - descuento;
  };

  // Función para calcular el salario neto real como en el modal de detalles
  const calculateRealSalarioNeto = (payroll: Payroll) => {
    const subtotalConsumos = payroll.consumos?.reduce((sum, consumo) => sum + consumo.valor, 0) || 0;
    const descuentoConsumos = subtotalConsumos * 0.15;
    const totalConsumos = subtotalConsumos - descuentoConsumos;
    return payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis;
  };

  // Función para formatear tiempo a formato 12 horas (HH:MM AM/PM) para Colombia
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    // Si el tiempo viene en formato HH:MM, convertir a formato 12 horas
    const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
    
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
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

  // Función auxiliar para obtener partes de fecha sin problemas de zona horaria
  const getLocalDateParts = (dateInput: string | Date) => {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      if (dateInput.includes('T') || dateInput.includes('Z')) {
        const datePart = dateInput.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        const [year, month, day] = dateInput.split('-').map(Number);
        date = new Date(year, month - 1, day);
      }
    } else {
      date = dateInput;
    }
    
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate()
    };
  };

  // Función para formatear el mes y año
  const formatMonthYear = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Función para obtener el mes y quincena actuales
  const getCurrentMonthAndFortnight = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    const day = now.getDate();
    
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const fortnight = day <= 15 ? 'primera' : 'segunda';
    const fortnightKey = `${monthKey}-${fortnight}`;
    
    return { monthKey, fortnightKey };
  };

  // Función para inicializar los estados de colapso
  const initializeCollapsedStates = (payrolls: Payroll[]) => {
    const { monthKey: currentMonthKey } = getCurrentMonthAndFortnight();
    
    // Obtener todos los meses únicos de los datos
    const allMonths = new Set<string>();
    const allFortnights = new Set<string>();
    
    payrolls.forEach(payroll => {
      const { year, month, day } = getLocalDateParts(payroll.fecha);
      const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      const fortnight = day <= 15 ? 'primera' : 'segunda';
      const fortnightKey = `${monthKey}-${fortnight}`;
      
      allMonths.add(monthKey);
      allFortnights.add(fortnightKey);
    });
    
    // Crear sets con todos los meses/quincenas colapsados excepto los actuales
    const collapsedMonths = new Set<string>();
    const collapsedFortnights = new Set<string>();
    
    allMonths.forEach(monthKey => {
      if (monthKey !== currentMonthKey) {
        collapsedMonths.add(monthKey);
      }
    });
    
    const { fortnightKey: currentFortnightKey } = getCurrentMonthAndFortnight();
    allFortnights.forEach(fortnightKey => {
      if (fortnightKey !== currentFortnightKey) {
        collapsedFortnights.add(fortnightKey);
      }
    });
    
    return { collapsedMonths, collapsedFortnights };
  };

  // Función para agrupar payrolls por mes y quincena
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
          // Calcular total real de la quincena sumando cada payroll calculado correctamente
          const totalEarnings = fortnights[fortnightKey].reduce((sum, payroll) => {
            // Calcular el salario neto real como en el modal de detalles
            const subtotalConsumos = payroll.consumos?.reduce((sum, consumo) => sum + consumo.valor, 0) || 0;
            const descuentoConsumos = subtotalConsumos * 0.15;
            const totalConsumos = subtotalConsumos - descuentoConsumos;
            const salarioNetoReal = payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis;
            return sum + salarioNetoReal;
          }, 0);
          const roundedTotalEarnings = Math.ceil(totalEarnings / 50) * 50;
          
          return {
            fortnightKey,
            fortnightName: fortnightKey === 'primera' ? 'Primera Quincena' : 'Segunda Quincena',
            payrolls: fortnights[fortnightKey].sort((a, b) => {
              // Ordenar por fecha dentro del grupo
              const dateA = new Date(a.fecha);
              const dateB = new Date(b.fecha);
              return dateB.getTime() - dateA.getTime();
            }),
            totalPayrolls: fortnights[fortnightKey].length,
            totalEarnings: roundedTotalEarnings,
            pendingRecords: fortnights[fortnightKey].filter(p => p.estado === 'PENDIENTE').length,
            processedRecords: fortnights[fortnightKey].filter(p => p.estado === 'PROCESADA').length,
            paidRecords: fortnights[fortnightKey].filter(p => p.estado === 'PAGADA').length
          };
        }),
        // Totales del mes completo
        totalPayrolls: allPayrolls.length,
        totalEarnings: Math.ceil(allPayrolls.reduce((sum, payroll) => {
          // Calcular el salario neto real como en el modal de detalles
          const subtotalConsumos = payroll.consumos?.reduce((sum, consumo) => sum + consumo.valor, 0) || 0;
          const descuentoConsumos = subtotalConsumos * 0.15;
          const totalConsumos = subtotalConsumos - descuentoConsumos;
          const salarioNetoReal = payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis;
          return sum + salarioNetoReal;
        }, 0) / 50) * 50,
        pendingRecords: allPayrolls.filter(p => p.estado === 'PENDIENTE').length,
        processedRecords: allPayrolls.filter(p => p.estado === 'PROCESADA').length,
        paidRecords: allPayrolls.filter(p => p.estado === 'PAGADA').length
      };
    });
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

  return (
    <ProtectedRoute requiredPermissions={["READ_PAYROLL"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  {isAdmin ? 'Gestión de Nómina' : 'Mi Nómina'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isAdmin 
                    ? 'Resumen ejecutivo de nóminas agrupadas por empleado' 
                    : `Resumen de tus registros de trabajo - ${currentEmployee?.user.nombre} ${currentEmployee?.user.apellido}`
                  }
                </p>
              </div>
              
              {hasPermission("CREATE_PAYROLL") && (
                <div className="mt-4 md:mt-0 md:ml-4 flex space-x-3">
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isAdmin ? 'Agregar Registro' : 'Agregar Mi Registro'}</span>
                  </Button>
                </div>
              )}
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
                    className="flex-1 cursor-pointer"
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
                    className='cursor-pointer'
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
                    className='cursor-pointer'
                    type="date"
                    value={filters.fechaFin}
                    onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Payrolls Grid */}
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
                          ? 'Comienza creando la primera nómina.' 
                          : 'Comienza registrando tu primer día de trabajo.'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Vista agrupada por mes y quincena */}
                    <div className="space-y-4">
                      {groupPayrollsByMonthAndFortnight(payrolls).map((monthGroup) => (
                        <div key={monthGroup.monthKey} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                          {/* Header del acordeón de mes */}
                          <button
                            onClick={() => toggleMonthCollapse(monthGroup.monthKey)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                {collapsedMonths.has(monthGroup.monthKey) ? (
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <div className="text-left">
                                  <h2 className="text-xl font-semibold text-gray-900">{monthGroup.monthYear}</h2>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(monthGroup.totalEarnings)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Total del mes
                              </div>
                            </div>
                          </button>

                          {/* Contenido del acordeón - Quincenas */}
                          {!collapsedMonths.has(monthGroup.monthKey) && (
                            <div className="border-t border-gray-200 bg-gray-50">
                              {monthGroup.fortnights.map((fortnightGroup, fortnightIndex) => (
                                <div key={`${monthGroup.monthKey}-${fortnightGroup.fortnightKey}`} className="border-b border-gray-200 last:border-b-0">
                                  {/* Header de quincena */}
                                  <button
                                    onClick={() => toggleFortnightCollapse(`${monthGroup.monthKey}-${fortnightGroup.fortnightKey}`)}
                                    className="w-full px-8 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center">
                                        {collapsedFortnights.has(`${monthGroup.monthKey}-${fortnightGroup.fortnightKey}`) ? (
                                          <ChevronRight className="h-4 w-4 text-gray-400" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="text-left">
                                        <h3 className="text-lg font-medium text-gray-900">{fortnightGroup.fortnightName}</h3>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-900">
                                        {formatCurrency(fortnightGroup.totalEarnings)}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Total quincena
                                      </div>
                                    </div>
                                  </button>

                                  {/* Contenido de la quincena - Lista de registros */}
                                  {!collapsedFortnights.has(`${monthGroup.monthKey}-${fortnightGroup.fortnightKey}`) && (
                                    <div className="bg-white">
                                      {/* Vista Desktop - Tabla */}
                                      <div className="hidden md:block">
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full bg-white">
                                            <thead className="bg-gray-50 border border-gray-200">
                                              <tr>
                                                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Día
                                                </th>
                                                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Horario
                                                </th>
                                                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Horas
                                                </th>
                                                <th className="px-1 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Salario
                                                </th>
                                                <th className="px-1 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Consumos
                                                </th>
                                                <th className="px-1 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Adelantos
                                                </th>
                                                <th className="px-1 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Descuadre
                                                </th>
                                                <th className="px-1 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Deuda Morchis
                                                </th>
                                                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Estado
                                                </th>
                                                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Total
                                                </th>
                                                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider  border-l border-gray-200">
                                                  Acciones
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                              {fortnightGroup.payrolls.map((payroll) => (
                                                <tr key={payroll.id} className="hover:bg-gray-50 transition-colors">
                                                  <td className="px-1 py-3 whitespace-nowrap text-center">
                                                    <div className="text-sm font-medium text-gray-900">
                                                      {getDayOnly(payroll.fecha)}
                                                    </div>
                                                  </td>
                                                  <td className="px-1 py-3 whitespace-nowrap text-center">
                                                    <div className="text-sm text-gray-900">
                                                      {formatTime(payroll.horaInicio)} - {formatTime(payroll.horaFin)}
                                                    </div>
                                                  </td>
                                                  <td className="px-1 py-3 whitespace-nowrap text-center">
                                                    <div className="text-sm font-medium text-blue-600">
                                                      {payroll.horasTrabajadas}h {payroll.minutosTrabajados > 0 && `${payroll.minutosTrabajados}m`}
                                                    </div>
                                                  </td>
                                                  <td className="px-1 py-3 whitespace-nowrap text-right">
                                                    <div className="text-sm font-medium text-gray-900">
                                                      {formatCurrency(payroll.salarioBruto)}
                                                    </div>
                                                  </td>
                                                  <td className="px-1 py-3 whitespace-nowrap text-right">
                                                    <div className="text-sm font-medium text-orange-600">
                                                      {formatCurrency(calculateTotalConsumos(payroll))}
                                                    </div>
                                                  </td>
                                                  <td className="px-1 py-3 whitespace-nowrap text-right">
                                                    <div className="text-sm font-medium text-orange-600">
                                                      {formatCurrency(payroll.adelantoNomina)}
                                                    </div>
                                                  </td>
                                                  <td className="px-1 py-3 whitespace-nowrap text-right">
                                                    <div className="text-sm font-medium text-orange-600">
                                                      {formatCurrency(payroll.descuadre || 0)}
                                                    </div>
                                                  </td>
                                                  <td className="px-1 py-3 whitespace-nowrap text-right">
                                                    <div className="text-sm font-medium text-green-600">
                                                      {formatCurrency(payroll.deudaMorchis)}
                                                    </div>
                                                  </td>
                                                  <td className="px-1 py-3 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(payroll.estado)}`}>
                                                      {payroll.estado}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-3 whitespace-nowrap text-right">
                                                    <div className="text-sm font-bold text-gray-600">
                                                      {formatTotal(calculateRealSalarioNeto(payroll))}
                                                    </div>
                                                  </td>
                                                  <td className="px-1 py-3 whitespace-nowrap text-center border-l border-gray-200">
                                                    <div className="flex items-center justify-center space-x-2">
                                                      <button
                                                        onClick={() => handleViewDetailsById(payroll.id)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                                        title="Ver detalle"
                                                      >
                                                        <Eye className="h-4 w-4" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleEditById(payroll.id)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                                        title="Editar"
                                                      >
                                                        <Edit className="h-4 w-4" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleDeleteById(payroll.id)}
                                                        className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                                                        title="Eliminar"
                                                      >
                                                        <Trash2 className="h-4 w-4" />
                                                      </button>
                                                    </div>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>

                                      {/* Vista Mobile - Cards */}
                                      <div className="md:hidden p-4 space-y-3">
                                        {fortnightGroup.payrolls.map((payroll) => (
                                          <div key={payroll.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                              <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                  Día {getDayOnly(payroll.fecha)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                  {formatTime(payroll.horaInicio)} - {formatTime(payroll.horaFin)}
                                                </p>
                                              </div>
                                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(payroll.estado)}`}>
                                                {payroll.estado}
                                              </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                              <div>
                                                <p className="text-gray-500">Horas trabajadas</p>
                                                <p className="font-medium text-blue-600">
                                                  {payroll.horasTrabajadas}h {payroll.minutosTrabajados > 0 && `${payroll.minutosTrabajados}m`}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">Salario</p>
                                                <p className="font-medium">
                                                  {formatCurrency(payroll.salarioBruto)}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">Consumos</p>
                                                <p className="font-medium text-orange-600">
                                                  {formatCurrency(calculateTotalConsumos(payroll))}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">Adelantos</p>
                                                <p className="font-medium text-purple-600">
                                                  {formatCurrency(payroll.adelantoNomina)}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">Descuadre</p>
                                                <p className="font-medium text-red-600">
                                                  {formatCurrency(payroll.descuadre || 0)}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">Deuda Morchis</p>
                                                <p className="font-medium text-indigo-600">
                                                  {formatCurrency(payroll.deudaMorchis)}
                                                </p>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                              <div>
                                                <p className="text-xs text-gray-500">Total</p>
                                                <p className="text-lg font-bold text-green-600">
                                                  {formatTotal(calculateRealSalarioNeto(payroll))}
                                                </p>
                                              </div>
                                              <div className="flex items-center space-x-3">
                                                <button
                                                  onClick={() => handleViewDetailsById(payroll.id)}
                                                  className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                                  title="Ver detalle"
                                                >
                                                  <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleEditById(payroll.id)}
                                                  className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                                  title="Editar"
                                                >
                                                  <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteById(payroll.id)}
                                                  className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                                                  title="Eliminar"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </button>
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
      {showCreateModal && (
        <CreatePayrollModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
          defaultEmployeeId={isEmployee ? currentEmployee?.id : undefined}
          isEmployeeView={!isAdmin}
        />
      )}

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

      {showPaymentModal && (
        <PayrollPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

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