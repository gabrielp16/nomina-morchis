import { useEffect, useState, type ChangeEvent } from 'react';
import { Edit, Package, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EditProductModal } from '../components/products/EditProductModal';
import { CreateProductModal } from '../components/products/CreateProductModal';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/api';
import type { Product } from '../types/auth';

export default function ProductsPage() {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadProducts();
  }, [currentPage, search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll(currentPage, 10, search);
      if (response.success && response.data) {
        setProducts(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        showError(response.error || 'Error al cargar productos');
        setProducts([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showError('Error al cargar productos');
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Confirmar eliminacion',
      message: '¿Seguro que deseas eliminar este producto? Esta accion no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmVariant: 'destructive'
    });

    if (!confirmed) return;

    try {
      const response = await productService.delete(id);
      if (response.success) {
        success('Producto eliminado exitosamente');
        loadProducts();
      } else {
        showError(response.error || 'Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('Error al eliminar producto');
    }
  };

  const formatCop = (value?: number | null) => {
    if (value === undefined || value === null) {
      return 'No definido';
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <ProtectedRoute requiredPermissions={['READ_USERS']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Productos
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Listado de productos con edicion y eliminacion.
                </p>
              </div>
              {hasPermission('CREATE_USERS') && (
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </Button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar productos por nombre o descripcion..."
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Cargando productos...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-10 w-10 mx-auto text-gray-300" />
                    <p className="mt-4 text-gray-500">No se encontraron productos</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {products.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                              <p className="text-sm text-gray-700 mt-1 max-w-[220px] truncate" title={product.description}>{product.description}</p>
                            </div>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {product.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div className="mt-3 text-sm text-gray-700">
                            <p><span className="font-medium">Precio:</span> {formatCop(product.price)}</p>
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-2">
                            {hasPermission('UPDATE_USERS') && (
                              <Button variant="ghost" size="sm" title="Editar" onClick={() => handleEdit(product)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission('DELETE_USERS') && (
                              <Button variant="ghost" size="sm" title="Eliminar" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Descripcion
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-700 max-w-md break-words">{product.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {product.active ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatCop(product.price)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  {hasPermission('UPDATE_USERS') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Editar"
                                      onClick={() => handleEdit(product)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {hasPermission('DELETE_USERS') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Eliminar"
                                      onClick={() => handleDelete(product.id)}
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
                  </>
                )}

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Pagina {currentPage} de {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

        {selectedProduct && (
          <EditProductModal
            isOpen={showEditModal}
            onClose={handleCloseEditModal}
            onSuccess={loadProducts}
            product={selectedProduct}
          />
        )}

        <CreateProductModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadProducts}
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
      </div>
    </ProtectedRoute>
  );
}
