import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Package, Tag, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import Modal from '../components/ui/modal';
import { useConfirm } from '../hooks/useConfirm';
import ordersService from '../services/ordersService';
import type { Product } from '../types/auth';

type ProductUnit = 'KG' | 'LT' | 'UN' | 'MT' | 'M2' | 'M3' | 'LB' | 'GAL' | 'OZ' | 'TON';

const UNITS = [
  { value: 'KG', label: 'Kilogramos (KG)' },
  { value: 'LT', label: 'Litros (LT)' },
  { value: 'UN', label: 'Unidades (UN)' },
  { value: 'MT', label: 'Metros (MT)' },
  { value: 'M2', label: 'Metros Cuadrados (M2)' },
  { value: 'M3', label: 'Metros Cúbicos (M3)' },
  { value: 'LB', label: 'Libras (LB)' },
  { value: 'GAL', label: 'Galones (GAL)' },
  { value: 'OZ', label: 'Onzas (OZ)' },
  { value: 'TON', label: 'Toneladas (TON)' }
];

export default function ProductsPage() {
  const { hasPermission } = useAuth();
  const { success, error } = useToast();
  const { confirm } = useConfirm();

  // Estado principal
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [activoFilter, setActivoFilter] = useState<string>('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cargar productos
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
    } catch (error: any) {
      console.error('Error loading products:', error);
      error('Error al cargar los productos');
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
      } catch (error: any) {
        error(error.message || 'Error al eliminar el producto');
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  // Obtener categorías únicas
  const categories = [...new Set(products.filter(p => p.categoria).map(p => p.categoria))];

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.categoria && product.categoria.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === '' || product.categoria === categoryFilter;
    
    const matchesActivo = activoFilter === '' || 
      (activoFilter === 'true' && product.activo) ||
      (activoFilter === 'false' && !product.activo);

    return matchesSearch && matchesCategory && matchesActivo;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

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
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Administra todos los productos del catálogo
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Productos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {products.length}
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
                      Productos Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {products.filter(p => p.activo).length}
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
                  <Tag className="h-8 w-8 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Categorías
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {categories.length}
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
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Valor Total Stock
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(
                        products
                          .filter(p => p.precio && p.stock)
                          .reduce((total, p) => total + (p.precio! * p.stock!), 0)
                      )}
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
                  placeholder="Buscar productos..."
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
                  setCategoryFilter('');
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
                    Categoría
                  </label>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </div>

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
                <p className="mt-2 text-gray-600">Cargando productos...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600 text-lg">No se encontraron productos</p>
                <p className="text-gray-500 text-sm mt-1">
                  {hasPermission('CREATE_USERS') && 'Crea tu primer producto haciendo clic en "Nuevo Producto"'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
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
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.descripcion || 'Sin descripción'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.categoria || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {product.unidad}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.precio ? formatCurrency(product.precio) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.stock !== undefined ? product.stock : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {hasPermission('UPDATE_USERS') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditProduct(product)}
                            aria-label={`Editar producto ${product.nombre}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('DELETE_USERS') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                            aria-label={`Eliminar producto ${product.nombre}`}
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
        <CreateProductModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadProducts}
        />

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

// Modal para crear producto
function CreateProductModal({ 
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
    descripcion: '',
    unidad: 'UN' as ProductUnit,
    categoria: '',
    precio: '',
    stock: '',
    activo: true
  });

  const handleClose = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      unidad: 'UN' as ProductUnit,
      categoria: '',
      precio: '',
      stock: '',
      activo: true
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      error('El nombre del producto es obligatorio');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        ...formData,
        precio: formData.precio ? parseFloat(formData.precio) : undefined,
        stock: formData.stock ? parseFloat(formData.stock) : undefined
      };

      await ordersService.createProduct(productData);
      success('Producto creado exitosamente');
      handleClose();
      onSuccess();
    } catch (error: any) {
      error(error.message || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Nuevo Producto"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <Input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Nombre del producto"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <Input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Descripción del producto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad de Medida *
            </label>
            <Select
              value={formData.unidad}
              onChange={(e) => setFormData({...formData, unidad: e.target.value as ProductUnit})}
            >
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <Input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({...formData, categoria: e.target.value})}
              placeholder="Categoría del producto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Unitario
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.precio}
              onChange={(e) => setFormData({...formData, precio: e.target.value})}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Inicial
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              placeholder="0"
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
            Crear Producto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Modal para editar producto
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
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad: 'UN' as ProductUnit,
    categoria: '',
    precio: '',
    stock: '',
    activo: true
  });

  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        unidad: product.unidad,
        categoria: product.categoria || '',
        precio: product.precio?.toString() || '',
        stock: product.stock?.toString() || '',
        activo: product.activo
      });
    }
  }, [product]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !formData.nombre.trim()) {
      error('El nombre del producto es obligatorio');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        ...formData,
        precio: formData.precio ? parseFloat(formData.precio) : undefined,
        stock: formData.stock ? parseFloat(formData.stock) : undefined
      };

      await ordersService.updateProduct(product.id, productData);
      success('Producto actualizado exitosamente');
      handleClose();
      onSuccess();
    } catch (error: any) {
      error(error.message || 'Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Editar Producto - ${product.nombre}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <Input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Nombre del producto"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <Input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Descripción del producto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad de Medida *
            </label>
            <Select
              value={formData.unidad}
              onChange={(e) => setFormData({...formData, unidad: e.target.value as ProductUnit})}
            >
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <Input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({...formData, categoria: e.target.value})}
              placeholder="Categoría del producto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Unitario
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.precio}
              onChange={(e) => setFormData({...formData, precio: e.target.value})}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              placeholder="0"
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
            Actualizar Producto
          </Button>
        </div>
      </form>
    </Modal>
  );
}
