import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import Modal from '../components/ui/modal';
import { useConfirm } from '../hooks/useConfirm';
import { formatCurrency, formatDateDisplay, dateToInputValue, inputValueToDate } from '../lib/utils';
import ordersService from '../services/ordersService';
import type { Product } from '../types/auth';

export default function ProductsPage() {
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activoFilter, setActivoFilter] = useState<string>('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await ordersService.getProducts();
      if (response.data) {
        setProducts(response.data);
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      showError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Producto',
      message: '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmVariant: 'destructive'
    });

    if (confirmed) {
      try {
        await ordersService.deleteProduct(id);
        success('Producto eliminado exitosamente');
        loadProducts();
      } catch (err: any) {
        showError(err.message || 'Error al eliminar el producto');
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchTerm === '' ||
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.numeroLote.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActivo =
      activoFilter === '' ||
      (activoFilter === 'true' && product.activo) ||
      (activoFilter === 'false' && !product.activo);

    return matchesSearch && matchesActivo;
  });

  if (!hasPermission('READ_USERS')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para ver los productos.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['READ_USERS']}>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Listado de Productos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Lista, edita y elimina productos del sistema
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            {hasPermission('CREATE_USERS') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Productos</dt>
                  <dd className="text-lg font-medium text-gray-900">{products.length}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Activos</dt>
                  <dd className="text-lg font-medium text-gray-900">{products.filter((p) => p.activo).length}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-yellow-500 rounded-full" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Inactivos</dt>
                  <dd className="text-lg font-medium text-gray-900">{products.filter((p) => !p.activo).length}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, descripción o lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="ghost" onClick={() => setShowFilters(!showFilters)} className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
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

          {showFilters && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <Select value={activoFilter} onChange={(e) => setActivoFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Select>
            </div>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                <p className="mt-2 text-gray-600">Cargando productos...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600 text-lg">No se encontraron productos</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.descripcion || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.numeroLote}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateDisplay(product.fechaVencimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.precio)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.activo ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {hasPermission('UPDATE_USERS') && (
                          <Button size="sm" variant="ghost" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('DELETE_USERS') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
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

        <CreateProductModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={loadProducts} />

        <EditProductModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadProducts}
          product={selectedProduct}
        />
      </div>
    </ProtectedRoute>
  );
}

function CreateProductModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    numeroLote: '',
    fechaVencimiento: '',
    precio: 0,
    activo: true
  });

  const handleClose = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      numeroLote: '',
      fechaVencimiento: '',
      precio: 0,
      activo: true
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.numeroLote.trim() || !formData.fechaVencimiento) {
      showError('Name, lot number y expiration date son obligatorios');
      return;
    }

    try {
      setLoading(true);
      await ordersService.createProduct({
        ...formData,
        fechaVencimiento: inputValueToDate(formData.fechaVencimiento)
      });
      success('Producto creado exitosamente');
      handleClose();
      onSuccess();
    } catch (err: any) {
      showError(err.message || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Nuevo Producto" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Product name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lot number *</label>
            <Input
              type="text"
              value={formData.numeroLote}
              onChange={(e) => setFormData({ ...formData, numeroLote: e.target.value })}
              placeholder="LOT-001"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Product description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiration date *</label>
            <Input
              type="date"
              value={formData.fechaVencimiento}
              onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
              required
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              id="activo-create"
              type="checkbox"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="activo-create" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Crear Producto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditProductModal({
  isOpen,
  onClose,
  onSuccess,
  product
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    numeroLote: '',
    fechaVencimiento: '',
    precio: 0,
    activo: true
  });

  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        numeroLote: product.numeroLote,
        fechaVencimiento: dateToInputValue(product.fechaVencimiento),
        precio: product.precio,
        activo: product.activo
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) {
      return;
    }

    try {
      setLoading(true);
      await ordersService.updateProduct(product.id, {
        ...formData,
        fechaVencimiento: inputValueToDate(formData.fechaVencimiento)
      });
      success('Producto actualizado exitosamente');
      onClose();
      onSuccess();
    } catch (err: any) {
      showError(err.message || 'Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Producto - ${product.nombre}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lot number *</label>
            <Input
              type="text"
              value={formData.numeroLote}
              onChange={(e) => setFormData({ ...formData, numeroLote: e.target.value })}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiration date *</label>
            <Input
              type="date"
              value={formData.fechaVencimiento}
              onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
              required
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              id="activo-edit"
              type="checkbox"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="activo-edit" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Actualizar Producto
          </Button>
        </div>
      </form>
    </Modal>
  );
}
