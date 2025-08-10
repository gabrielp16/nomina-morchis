import { useState, useEffect } from 'react';
import { useAuth } from '~/context/AuthContext';
import type { ChangeEvent } from 'react';
import { Plus, Search, Edit, Trash2, Shield, ShieldOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { EditRoleModal } from '../components/roles/EditRoleModal';
import { CreateRoleModal } from '../components/roles/CreateRoleModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { roleService } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Role, PaginatedResponse } from '../types/auth';

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadRoles();
  }, [currentPage, search]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await roleService.getAll(currentPage, 10, search);
      if (response.success && response.data) {
        setRoles(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        showError(response.error || 'Error al caargar los roles');
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      showError('Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmVariant: 'destructive'
    });

    if (confirmed) {
      try {
        const response = await roleService.delete(id);
        if (response.success) {
          success('Rol eliminado exitosamente');
          loadRoles();
        } else {
          showError(response.error || 'Error al eliminar el rol');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        showError('Error al eliminar el rol');
      }
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = isActive 
        ? await roleService.deactivate(id)
        : await roleService.activate(id);
      
      if (response.success) {
        success(`Rol ${isActive ? 'desactivado' : 'activado'} exitosamente`);
        loadRoles();
      } else {
        showError(response.error || 'Error al eliminar el rol');
      }
    } catch (error) {
      console.error('Error toggling role status:', error);
      showError('Error al cambiar el estado del rol');
    }
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedRole(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  return (
    <ProtectedRoute requiredPermissions={["READ_ROLES"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Gestión de Roles
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Administra los roles del sistema y sus permisos asociados
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                {hasPermission('CREATE_ROLES') && hasPermission('READ_PERMISSIONS') && (<Button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Rol
                </Button>)}
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar roles..."
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Roles Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Cargando roles...</p>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No se encontraron roles</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Permisos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map((role) => (
                          <tr key={role.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                                  <Shield className="h-5 w-5 text-white" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {role.nombre}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Creado {new Date(role.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {role.descripcion || 'Sin descripción'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {role.permisos.length} permisos
                              </div>
                              <div className="text-sm text-gray-500" title={role.permisos.map(p => p.nombre).join(', ')}>
                                {role.permisos.slice(0, 3).map(p => p.nombre).join(', ')}
                                {role.permisos.length > 3 && '...'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span 
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  role.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {role.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={role.isActive ? 'Desactivar' : 'Activar'}
                                  onClick={() => handleToggleActive(role.id, role.isActive)}
                                >
                                  {role.isActive ? (
                                    <ShieldOff className="h-4 w-4" />
                                  ) : (
                                    <Shield className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Editar"
                                  onClick={() => handleEdit(role)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title='Eliminar'
                                  onClick={() => handleDelete(role.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

        {/* Create Role Modal */}
        <CreateRoleModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onSuccess={loadRoles}
        />

        {/* Edit Role Modal */}
        {selectedRole && (
          <EditRoleModal
            isOpen={showEditModal}
            onClose={handleCloseEditModal}
            onSuccess={loadRoles}
            role={selectedRole}
          />
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          confirmVariant={confirmState.confirmVariant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </div>
    </ProtectedRoute>
  );
}
