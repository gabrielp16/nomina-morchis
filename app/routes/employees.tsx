import { useState, useEffect, type ChangeEvent } from 'react';
import { Plus, Search, Edit, Trash2, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { employeeService } from '../services/api';
import type { Employee } from '../types/auth';
import { CreateEmployeeModal } from '../components/employees/CreateEmployeeModal';
import { EditEmployeeModal } from '../components/employees/EditEmployeeModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadEmployees();
  }, [currentPage, search]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getAll(currentPage, 10, search);
      if (response.success && response.data) {
        setEmployees(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      showError('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    const result = await confirm({
      title: '¿Estás seguro?',
      message: `¿Deseas desactivar al empleado ${employee.user.nombre} ${employee.user.apellido}? Esta acción se puede revertir.`
    });

    if (result) {
      try {
        const response = await employeeService.delete(employee.id);
        if (response.success) {
          success('Empleado desactivado exitosamente');
          loadEmployees();
        } else {
          showError(response.error || 'Error al desactivar empleado');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        showError('Error al desactivar empleado');
      }
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleModalSuccess = () => {
    loadEmployees();
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedEmployee(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ProtectedRoute requiredPermissions={["READ_USERS"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Gestión de Empleados
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Administra los empleados y sus salarios por hora para el cálculo de nómina
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                {hasPermission('CREATE_USERS') && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Empleado
                  </Button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar empleados..."
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {search ? 'No se encontraron empleados que coincidan con la búsqueda.' : 'Comienza creando tu primer empleado.'}
                    </p>
                    {hasPermission('CREATE_USERS') && !search && (
                      <div className="mt-6">
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Empleado
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Empleado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contacto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Salario/Hora
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha Registro
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {employees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <User className="h-5 w-5 text-gray-500" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {employee.user.nombre} {employee.user.apellido}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{employee.user.correo}</div>
                                <div className="text-sm text-gray-500">{employee.user.numeroCelular}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(employee.salarioPorHora)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(employee.createdAt).toLocaleDateString('es-ES')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  {hasPermission('UPDATE_USERS') && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(employee)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {hasPermission('DELETE_USERS') && employee.isActive && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(employee)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-4">
                      {employees.map((employee) => (
                        <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
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
                          
                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Teléfono:</span>
                              <div className="font-medium">{employee.user.numeroCelular}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Salario/Hora:</span>
                              <div className="font-medium">{formatCurrency(employee.salarioPorHora)}</div>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end space-x-2">
                            {hasPermission('UPDATE_USERS') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(employee)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            )}
                            {hasPermission('DELETE_USERS') && employee.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(employee)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Desactivar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEmployeeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showEditModal && selectedEmployee && (
        <EditEmployeeModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleModalSuccess}
          employee={selectedEmployee}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Desactivar"
        cancelText="Cancelar"
      />
    </ProtectedRoute>
  );
}
