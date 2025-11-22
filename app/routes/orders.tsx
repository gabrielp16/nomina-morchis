import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { formatDateDisplay, dateToInputValue, formatCurrency } from '../lib/utils';
import ordersService from '../services/ordersService';
import CreateOrderModal from '../components/orders/CreateOrderModal';
import EditOrderModal from '../components/orders/EditOrderModal';
import type { Order, OrderFilters, Client, Product } from '../types/auth';

export default function OrdersPage() {
  const { hasPermission } = useAuth();
  const { success, error } = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // Estado principal
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 10
  });

  // Paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar órdenes cuando cambian los filtros
  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [ordersRes, clientsRes, productsRes] = await Promise.all([
        ordersService.getOrders(filters),
        ordersService.getClients(),
        ordersService.getProducts()
      ]);

      if (ordersRes.data) {
        setOrders(ordersRes.data || []);
        setPagination(ordersRes.pagination || pagination);
      }

      if (clientsRes.data) {
        setClients(clientsRes.data || []);
      }

      if (productsRes.data) {
        setProducts(productsRes.data || []);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      error('Error al cargar los datos', err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await ordersService.getOrders(filters);
      if (response.data) {
        setOrders(response.data || []);
        setPagination(response.pagination || pagination);
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      error('Error al cargar las órdenes', err.message || 'Error desconocido');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Orden',
      message: '¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmVariant: 'destructive'
    });
    
    if (confirmed) {
      try {
        await ordersService.deleteOrder(id);
        success('Orden eliminada exitosamente');
        loadOrders();
      } catch (err: any) {
        error('Error al eliminar la orden', err.message || 'Error desconocido');
      }
    }
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10
    });
    setSearchTerm('');
  };

  const applyFilters = () => {
    setFilters(prev => ({
      ...prev,
      page: 1
    }));
  };

  const getStatusBadge = (estado: string) => {
    const statusConfig: Record<string, string> = {
      'POR PAGAR': 'bg-yellow-100 text-yellow-800',
      'PAGADO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800',
      'ENTREGADO': 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado}
      </span>
    );
  };

  const getClientName = (cliente: Client | string) => {
    if (typeof cliente === 'string') {
      const clientObj = clients.find(c => c.id === cliente);
      return clientObj ? `${clientObj.nombre} ${clientObj.apellido}` : 'Cliente no encontrado';
    }
    return `${cliente.nombre} ${cliente.apellido}`;
  };

  const getProductName = (producto: Product | string) => {
    if (typeof producto === 'string') {
      const productObj = products.find(p => p.id === producto);
      return productObj ? productObj.nombre : 'Producto no encontrado';
    }
    return producto.nombre;
  };

  if (!hasPermission('READ_USERS')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para ver las órdenes.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona todas las órdenes del sistema
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
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
                  placeholder="Buscar por lote..."
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
              <Button variant="ghost" onClick={resetFilters}>
                Limpiar
              </Button>
              <Button onClick={applyFilters}>
                Aplicar
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <Input
                  type="date"
                  value={filters.fechaInicio ? dateToInputValue(filters.fechaInicio) : ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    fechaInicio: e.target.value ? new Date(e.target.value + 'T00:00:00.000Z') : undefined
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <Input
                  type="date"
                  value={filters.fechaFin ? dateToInputValue(filters.fechaFin) : ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    fechaFin: e.target.value ? new Date(e.target.value + 'T00:00:00.000Z') : undefined
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <Select
                  value={filters.cliente || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    cliente: e.target.value || undefined
                  }))}
                >
                  <option value="">Todos los clientes</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.nombre} {client.apellido}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto
                </label>
                <Select
                  value={filters.producto || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    producto: e.target.value || undefined
                  }))}
                >
                  <option value="">Todos los productos</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <Select
                  value={filters.estado || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    estado: e.target.value || undefined
                  }))}
                >
                  <option value="">Todos los estados</option>
                  <option value="POR PAGAR">Por Pagar</option>
                  <option value="PAGADO">Pagado</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="ENTREGADO">Entregado</option>
                </Select>
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
                <p className="mt-2 text-gray-600">Cargando órdenes...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600 text-lg">No se encontraron órdenes</p>
                <p className="text-gray-500 text-sm mt-1">
                  {hasPermission('CREATE_USERS') && 'Crea tu primera orden haciendo clic en "Nueva Orden"'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cant.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
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
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateDisplay(order.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getClientName(order.cliente)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getProductName(order.producto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.lote}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.cantidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.precio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditOrder(order)}
                          aria-label={`Editar orden del ${order.fecha} para ${typeof order.cliente === 'string' ? order.cliente : order.cliente?.nombre || 'cliente desconocido'}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-700"
                          aria-label={`Eliminar orden del ${order.fecha} para ${typeof order.cliente === 'string' ? order.cliente : order.cliente?.nombre || 'cliente desconocido'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {!loading && orders.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="ghost"
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                    disabled={pagination.currentPage <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page! + 1) }))}
                    disabled={pagination.currentPage >= pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> de{' '}
                      <span className="font-medium">{pagination.totalItems}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <Button
                        variant="ghost"
                        onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                        disabled={pagination.currentPage <= 1}
                        className="rounded-l-md"
                      >
                        Anterior
                      </Button>
                      <span className="px-4 py-2 text-sm text-gray-700 bg-white border-t border-b border-gray-300">
                        Página {pagination.currentPage} de {pagination.totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page! + 1) }))}
                        disabled={pagination.currentPage >= pagination.totalPages}
                        className="rounded-r-md"
                      >
                        Siguiente
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadOrders}
      />

      <EditOrderModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadOrders}
        order={selectedOrder}
      />

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
    </ProtectedRoute>
  );
}