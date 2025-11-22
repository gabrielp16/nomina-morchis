import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Building, Mail, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import Modal from '../components/ui/modal';
import { useConfirm } from '../hooks/useConfirm';
import ordersService from '../services/ordersService';
import type { Client } from '../types/auth';

export default function ClientsPage() {
  const { hasPermission } = useAuth();
  const { success, error } = useToast();
  const { confirm } = useConfirm();

  // Estado principal
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activoFilter, setActivoFilter] = useState<string>('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Cargar clientes
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await ordersService.getClients();
      if (response.data) {
        setClients(response.data);
      }
    } catch (error: any) {
      console.error('Error loading clients:', error);
      error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Cliente',
      message: '¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmVariant: 'destructive'
    });

    if (confirmed) {
      try {
        await ordersService.deleteClient(id);
        success('Cliente eliminado exitosamente');
        loadClients();
      } catch (error: any) {
        error(error.message || 'Error al eliminar el cliente');
      }
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = searchTerm === '' || 
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.correo && client.correo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.empresa && client.empresa.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesActivo = activoFilter === '' || 
      (activoFilter === 'true' && client.activo) ||
      (activoFilter === 'false' && !client.activo);

    return matchesSearch && matchesActivo;
  });

  if (!hasPermission('READ_USERS')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para ver los clientes.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['READ_USERS']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="mt-1 text-sm text-gray-600">
              Administra todos los clientes del sistema
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            {hasPermission('CREATE_USERS') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Clientes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {clients.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-500 rounded-full" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Clientes Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {clients.filter(c => c.activo).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building className="h-8 w-8 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Con Empresa
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {clients.filter(c => c.empresa).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchTerm('');
                  setActivoFilter('');
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <Select
                    value={activoFilter}
                    onChange={(e) => setActivoFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando clientes...</p>
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600 text-lg">No se encontraron clientes</p>
                <p className="text-gray-500 text-sm mt-1">
                  {hasPermission('CREATE_USERS') && 'Crea tu primer cliente haciendo clic en "Nuevo Cliente"'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {client.nombre.charAt(0)}{client.apellido.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.nombre} {client.apellido}
                            </div>
                            <div className="text-sm text-gray-500">
                              Cliente desde {new Date(client.fechaCreacion).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {client.correo && (
                            <div className="flex items-center text-sm text-gray-900">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {client.correo}
                            </div>
                          )}
                          {client.telefono && (
                            <div className="flex items-center text-sm text-gray-900">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {client.telefono}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client.empresa || '-'}
                        </div>
                        {client.direccion && (
                          <div className="text-sm text-gray-500">
                            {client.direccion}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {hasPermission('UPDATE_USERS') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClient(client)}
                            aria-label={`Editar cliente ${client.nombre} ${client.apellido}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('DELETE_USERS') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-red-600 hover:text-red-700"
                            aria-label={`Eliminar cliente ${client.nombre} ${client.apellido}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modales */}
        <CreateClientModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadClients}
        />

        <EditClientModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadClients}
          client={selectedClient}
        />
      </div>
    </ProtectedRoute>
  );
}

// Modal para crear cliente
function CreateClientModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    direccion: '',
    empresa: '',
    activo: true
  });

  const handleClose = () => {
    setFormData({
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      direccion: '',
      empresa: '',
      activo: true
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      error('Nombre y apellido son obligatorios');
      return;
    }

    try {
      setLoading(true);
      await ordersService.createClient(formData);
      success('Cliente creado exitosamente');
      handleClose();
      onSuccess();
    } catch (error: any) {
      error(error.message || 'Error al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Nuevo Cliente"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <Input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <Input
              type="text"
              value={formData.apellido}
              onChange={(e) => setFormData({...formData, apellido: e.target.value})}
              placeholder="Apellido del cliente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <Input
              type="email"
              value={formData.correo}
              onChange={(e) => setFormData({...formData, correo: e.target.value})}
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <Input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              placeholder="+34 600 123 456"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <Input
              type="text"
              value={formData.empresa}
              onChange={(e) => setFormData({...formData, empresa: e.target.value})}
              placeholder="Nombre de la empresa"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <Input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              placeholder="Dirección completa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <Select
              value={formData.activo.toString()}
              onChange={(e) => setFormData({...formData, activo: e.target.value === 'true'})}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            Crear Cliente
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Modal para editar cliente
function EditClientModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  client
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: Client | null;
}) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    direccion: '',
    empresa: '',
    activo: true
  });

  useEffect(() => {
    if (client) {
      setFormData({
        nombre: client.nombre,
        apellido: client.apellido,
        correo: client.correo || '',
        telefono: client.telefono || '',
        direccion: client.direccion || '',
        empresa: client.empresa || '',
        activo: client.activo
      });
    }
  }, [client]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client || !formData.nombre.trim() || !formData.apellido.trim()) {
      error('Nombre y apellido son obligatorios');
      return;
    }

    try {
      setLoading(true);
      await ordersService.updateClient(client.id, formData);
      success('Cliente actualizado exitosamente');
      handleClose();
      onSuccess();
    } catch (error: any) {
      error(error.message || 'Error al actualizar el cliente');
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Editar Cliente - ${client.nombre} ${client.apellido}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <Input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <Input
              type="text"
              value={formData.apellido}
              onChange={(e) => setFormData({...formData, apellido: e.target.value})}
              placeholder="Apellido del cliente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <Input
              type="email"
              value={formData.correo}
              onChange={(e) => setFormData({...formData, correo: e.target.value})}
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <Input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              placeholder="+34 600 123 456"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <Input
              type="text"
              value={formData.empresa}
              onChange={(e) => setFormData({...formData, empresa: e.target.value})}
              placeholder="Nombre de la empresa"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <Input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              placeholder="Dirección completa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <Select
              value={formData.activo.toString()}
              onChange={(e) => setFormData({...formData, activo: e.target.value === 'true'})}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            Actualizar Cliente
          </Button>
        </div>
      </form>
    </Modal>
  );
}