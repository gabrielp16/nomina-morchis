import { useState, useEffect, type ChangeEvent } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, Clock, DollarSign, Banknote, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isAdmin) {
      Promise.all([loadPayrolls(), loadEmployees()]);
    } else if (isEmployee) {
      loadPayrolls();
    }
  }, [search, filters, isAdmin, isEmployee]); // Removed currentPage dependency

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const response = await payrollService.getAll(1, 1000, { // Load all records with high limit
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
    // Solo cargar empleados si es admin
    if (!isAdmin) return;
    
    try {
      const response = await employeeService.getAll(1, 100); // Cargar todos los empleados
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
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

  // Función para agrupar payrolls por mes y año
  const groupPayrollsByMonth = (payrolls: Payroll[]) => {
    const groups: { [key: string]: Payroll[] } = {};
    
    payrolls.forEach(payroll => {
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      let year: number, month: number;
      
      if (typeof payroll.fecha === 'string') {
        // Si es un string ISO, extraer directamente
        if (payroll.fecha.includes('T') || payroll.fecha.includes('Z')) {
          // Para fechas ISO como "2025-09-01T00:00:00.000Z"
          const datePart = payroll.fecha.split('T')[0];
          const [yearStr, monthStr] = datePart.split('-');
          year = parseInt(yearStr);
          month = parseInt(monthStr) - 1; // JavaScript meses van de 0-11
        } else {
          // Para fechas en formato "YYYY-MM-DD"
          const [yearStr, monthStr] = payroll.fecha.split('-');
          year = parseInt(yearStr);
          month = parseInt(monthStr) - 1; // JavaScript meses van de 0-11
        }
      } else {
        // Si es un objeto Date
        const date = new Date(payroll.fecha);
        year = date.getFullYear();
        month = date.getMonth();
      }
      
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(payroll);
    });

    // Ordenar grupos por fecha (más reciente primero)
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    return sortedGroupKeys.map(key => ({
      key,
      monthYear: formatMonthYear(key),
      payrolls: groups[key].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    }));
  };

  // Función para agrupar empleados por mes con su estado consolidado
  const groupEmployeesByMonth = (payrolls: Payroll[]) => {
    const groups: { [key: string]: { [employeeId: string]: { employee: any, status: string, totalEarnings: number, recordCount: number } } } = {};
    
    payrolls.forEach(payroll => {
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      let year: number, month: number;
      
      if (typeof payroll.fecha === 'string') {
        // Si es un string ISO, extraer directamente
        if (payroll.fecha.includes('T') || payroll.fecha.includes('Z')) {
          // Para fechas ISO como "2025-09-01T00:00:00.000Z"
          const datePart = payroll.fecha.split('T')[0];
          const [yearStr, monthStr] = datePart.split('-');
          year = parseInt(yearStr);
          month = parseInt(monthStr) - 1; // JavaScript meses van de 0-11
        } else {
          // Para fechas en formato "YYYY-MM-DD"
          const [yearStr, monthStr] = payroll.fecha.split('-');
          year = parseInt(yearStr);
          month = parseInt(monthStr) - 1; // JavaScript meses van de 0-11
        }
      } else {
        // Si es un objeto Date
        const date = new Date(payroll.fecha);
        year = date.getFullYear();
        month = date.getMonth();
      }
      
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      const employeeId = payroll.employee?.id || 'unknown';
      
      if (!groups[monthKey]) {
        groups[monthKey] = {};
      }
      
      if (!groups[monthKey][employeeId]) {
        groups[monthKey][employeeId] = {
          employee: payroll.employee,
          status: payroll.estado,
          totalEarnings: 0,
          recordCount: 0
        };
      }
      
      // Actualizar el estado consolidado (prioridad: PAGADA > PROCESADA > PENDIENTE)
      const currentStatus = groups[monthKey][employeeId].status;
      const newStatus = payroll.estado;
      
      if (currentStatus === 'PENDIENTE' && (newStatus === 'PROCESADA' || newStatus === 'PAGADA')) {
        groups[monthKey][employeeId].status = newStatus;
      } else if (currentStatus === 'PROCESADA' && newStatus === 'PAGADA') {
        groups[monthKey][employeeId].status = newStatus;
      }
      
      // Sumar ganancias y contar registros
      groups[monthKey][employeeId].totalEarnings += calculateCorrectSalarioNeto(payroll);
      groups[monthKey][employeeId].recordCount += 1;
    });

    // Ordenar grupos por fecha (más reciente primero)
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    return sortedGroupKeys.map(key => ({
      key,
      monthYear: formatMonthYear(key),
      employees: Object.values(groups[key]).sort((a, b) => 
        (a.employee?.user?.nombre || '').localeCompare(b.employee?.user?.nombre || '')
      )
    }));
  };

  // Función para formatear el mes y año
  const formatMonthYear = (key: string) => {
    const [year, month] = key.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month)]} ${year}`;
  };

  // Función para obtener la clave del mes actual
  const getCurrentMonthKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // getMonth() ya devuelve 0-11
    return `${year}-${month.toString().padStart(2, '0')}`;
  };

  // Función para alternar el estado de colapso de un grupo
  const toggleGroupCollapse = (groupKey: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupKey)) {
      newCollapsed.delete(groupKey);
    } else {
      newCollapsed.add(groupKey);
    }
    setCollapsedGroups(newCollapsed);
  };

  // Inicializar grupos colapsados (todos excepto el mes actual)
  useEffect(() => {
    if (payrolls.length > 0) {
      const currentMonthKey = getCurrentMonthKey();
      const groups = groupPayrollsByMonth(payrolls);
      const initialCollapsed = new Set<string>();
      
      groups.forEach(group => {
        if (group.key !== currentMonthKey) {
          initialCollapsed.add(group.key);
        }
      });
      
      setCollapsedGroups(initialCollapsed);
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
                  {isAdmin ? 'Gestión de Nómina' : 'Mi Nómina'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isAdmin 
                    ? 'Administra los pagos de nómina de los empleados' 
                    : `Registra tus horas trabajadas y consumos diarios - ${currentEmployee?.user.nombre} ${currentEmployee?.user.apellido}`
                  }
                </p>
              </div>
              <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
                {/* Botón Pagar nómina - Solo para Super Administrador */}
                {isAdmin && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    variant="outline"
                    className="inline-flex items-center"
                  >
                    <Banknote className="h-4 w-4 mr-2" />
                    Pagar Nómina
                  </Button>
                )}
                
                {/* Botón Nueva Nómina / Registrar Día de Trabajo */}
                {hasPermission('CREATE_PAYROLL') && (isAdmin || isEmployee) && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Nueva Nómina' : 'Registrar Día de Trabajo'}
                  </Button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className={`grid gap-4 ${isAdmin ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
                {/* Search - Solo para admins */}
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

                {/* Estado */}
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

                {/* Empleado - Solo para admin */}
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

                {/* Acciones */}
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

              {/* Filtros de fecha */}
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
                          ? 'Comienza creando la primera nómina.' 
                          : 'Comienza registrando tu primer día de trabajo.'
                      }
                    </p>
                    {hasPermission('CREATE_PAYROLL') && !search && !Object.values(filters).some(v => v) && (isAdmin || isEmployee) && (
                      <div className="mt-6">
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          {isAdmin ? 'Nueva Nómina' : 'Registrar Día de Trabajo'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Vista por acordeones agrupados por mes/año para todos los usuarios */}
                    <div className="space-y-4">
                      {groupEmployeesByMonth(payrolls).map((group) => (
                        <div key={group.key} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                          {/* Header del acordeón */}
                          <button
                            onClick={() => toggleGroupCollapse(group.key)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center">
                                {collapsedGroups.has(group.key) ? (
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <h3 className="text-lg font-medium text-gray-900">{group.monthYear}</h3>
                              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                {group.employees.length} {group.employees.length === 1 ? 'empleado' : 'empleados'}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                Total: {formatCurrency(group.employees.reduce((sum, emp) => sum + emp.totalEarnings, 0))}
                              </div>
                              <div className="text-xs text-gray-500">
                                {group.employees.filter(emp => emp.status === 'PAGADA').length} pagado{group.employees.filter(emp => emp.status === 'PAGADA').length !== 1 ? 's' : ''} de {group.employees.length}
                              </div>
                            </div>
                          </button>

                          {/* Contenido del acordeón - Vista por empleados */}
                          {!collapsedGroups.has(group.key) && (
                            <div className="border-t border-gray-200">
                              {/* Desktop list */}
                              <div className="hidden lg:block">
                                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                                  <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div>Empleado</div>
                                    <div>Estado</div>
                                    <div>Total Ganado</div>
                                    <div className="text-right">Registros</div>
                                  </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                  {group.employees.map((empData, index) => (
                                    <div key={empData.employee?.id || index} className="px-6 py-4 hover:bg-gray-50">
                                      <div className="grid grid-cols-4 gap-4 items-center">
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {empData.employee?.user?.nombre || 'Usuario'} {empData.employee?.user?.apellido || ''}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {empData.employee?.user?.correo || 'N/A'}
                                          </div>
                                        </div>
                                        <div>
                                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(empData.status)}`}>
                                            {empData.status}
                                          </span>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {formatCurrency(empData.totalEarnings)}
                                        </div>
                                        <div className="text-right text-sm text-gray-500">
                                          {empData.recordCount} día{empData.recordCount !== 1 ? 's' : ''}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Mobile cards */}
                              <div className="lg:hidden space-y-4 p-4">
                                {group.employees.map((empData, index) => (
                                  <div key={empData.employee?.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {empData.employee?.user?.nombre || 'Usuario'} {empData.employee?.user?.apellido || ''}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {empData.recordCount} día{empData.recordCount !== 1 ? 's' : ''} trabajado{empData.recordCount !== 1 ? 's' : ''}
                                        </div>
                                      </div>
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(empData.status)}`}>
                                        {empData.status}
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-500 text-sm">Total del mes:</span>
                                      <span className="font-medium text-gray-900">
                                        {formatCurrency(empData.totalEarnings)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <PayrollPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
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
