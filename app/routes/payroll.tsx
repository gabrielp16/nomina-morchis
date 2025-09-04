import { useState, useEffect, type ChangeEvent } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, Clock, DollarSign, Banknote, ChevronDown, ChevronRight, Eye } from 'lucide-react';
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
  const [collapsedEmployees, setCollapsedEmployees] = useState<Set<string>>(new Set());
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

  // Función para agrupar payrolls por empleado
  const groupPayrollsByEmployee = (payrolls: Payroll[]) => {
    const employeeGroups: { [employeeId: string]: Payroll[] } = {};
    
    payrolls.forEach(payroll => {
      const employeeId = payroll.employee?.id || 'sin-empleado';
      
      if (!employeeGroups[employeeId]) {
        employeeGroups[employeeId] = [];
      }
      
      employeeGroups[employeeId].push(payroll);
    });

    // Convertir a array y ordenar por nombre del empleado
    return Object.entries(employeeGroups).map(([employeeId, payrolls]) => ({
      employeeId,
      employee: payrolls[0]?.employee,
      payrolls: payrolls.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
      totalEarnings: payrolls.reduce((sum, p) => sum + p.salarioNeto, 0),
      totalRecords: payrolls.length,
      pendingRecords: payrolls.filter(p => p.estado === 'PENDIENTE').length,
      processedRecords: payrolls.filter(p => p.estado === 'PROCESADA').length,
      paidRecords: payrolls.filter(p => p.estado === 'PAGADA').length
    })).sort((a, b) => {
      const nameA = `${a.employee?.user?.nombre || ''} ${a.employee?.user?.apellido || ''}`;
      const nameB = `${b.employee?.user?.nombre || ''} ${b.employee?.user?.apellido || ''}`;
      return nameA.localeCompare(nameB);
    });
  };

  // Función para alternar el estado de colapso de un empleado
  const toggleEmployeeCollapse = (employeeId: string) => {
    const newCollapsed = new Set(collapsedEmployees);
    if (newCollapsed.has(employeeId)) {
      newCollapsed.delete(employeeId);
    } else {
      newCollapsed.add(employeeId);
    }
    setCollapsedEmployees(newCollapsed);
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
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
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
                    {/* Vista agrupada por empleado */}
                    <div className="space-y-4">
                      {groupPayrollsByEmployee(payrolls).map((employeeGroup) => (
                        <div key={employeeGroup.employeeId} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                          {/* Header del acordeón de empleado */}
                          <button
                            onClick={() => toggleEmployeeCollapse(employeeGroup.employeeId)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                {collapsedEmployees.has(employeeGroup.employeeId) ? (
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-lg font-medium text-white">
                                    {employeeGroup.employee?.user?.nombre?.charAt(0)}{employeeGroup.employee?.user?.apellido?.charAt(0)}
                                  </span>
                                </div>
                                <div className="text-left">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {employeeGroup.employee?.user?.nombre} {employeeGroup.employee?.user?.apellido}
                                  </h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                      {employeeGroup.totalRecords} {employeeGroup.totalRecords === 1 ? 'registro' : 'registros'}
                                    </span>
                                    {employeeGroup.pendingRecords > 0 && (
                                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {employeeGroup.pendingRecords} pendiente{employeeGroup.pendingRecords !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                    {employeeGroup.paidRecords > 0 && (
                                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {employeeGroup.paidRecords} pagado{employeeGroup.paidRecords !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">
                                {formatCurrency(employeeGroup.totalEarnings)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Total acumulado
                              </div>
                            </div>
                          </button>

                          {/* Contenido del acordeón - Lista de registros */}
                          {!collapsedEmployees.has(employeeGroup.employeeId) && (
                            <div className="border-t border-gray-200 bg-gray-50">
                              
                              {/* Vista Desktop - Tabla */}
                              <div className="hidden md:block">
                                <div className="overflow-x-auto">
                                  <table className="min-w-full bg-white">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                      <tr>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Día
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Horario
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Horas
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Salario Base
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Salario Neto
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Estado
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Acciones
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {employeeGroup.payrolls.map((payroll) => (
                                        <tr key={payroll.id} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm font-medium text-gray-900">
                                              {getDayOnly(payroll.fecha)}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900">
                                              {payroll.horaInicio} - {payroll.horaFin}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm font-medium text-blue-600">
                                              {payroll.horasTrabajadas}h {payroll.minutosTrabajados > 0 && `${payroll.minutosTrabajados}m`}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                              {formatCurrency(payroll.salarioBruto)}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-green-600">
                                              {formatCurrency(payroll.salarioNeto)}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(payroll.estado)}`}>
                                              {payroll.estado}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                              <button
                                                onClick={() => handleViewDetailsById(payroll.id)}
                                                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                                title="Ver detalle"
                                              >
                                                <Eye className="h-4 w-4" />
                                              </button>
                                              <button
                                                onClick={() => handleEditById(payroll.id)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Editar"
                                              >
                                                <Edit className="h-4 w-4" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteById(payroll.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
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
                                {employeeGroup.payrolls.map((payroll) => (
                                  <div key={payroll.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          Día {getDayOnly(payroll.fecha)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {payroll.horaInicio} - {payroll.horaFin}
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
                                        <p className="text-gray-500">Salario Base</p>
                                        <p className="font-medium">
                                          {formatCurrency(payroll.salarioBruto)}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                      <div>
                                        <p className="text-xs text-gray-500">Salario Neto</p>
                                        <p className="text-lg font-bold text-green-600">
                                          {formatCurrency(payroll.salarioNeto)}
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <button
                                          onClick={() => handleViewDetailsById(payroll.id)}
                                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                          title="Ver detalle"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleEditById(payroll.id)}
                                          className="text-blue-600 hover:text-blue-800 transition-colors"
                                          title="Editar"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteById(payroll.id)}
                                          className="text-red-600 hover:text-red-800 transition-colors"
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