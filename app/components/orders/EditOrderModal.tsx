import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarDays } from 'lucide-react';
import Modal from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../../context/ToastContext';
import { dateToInputValue } from '../../lib/utils';
import ordersService from '../../services/ordersService';
import type { Order, OrderFormData, Client, Product } from '../../types/auth';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: Order | null;
}

export default function EditOrderModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  order 
}: EditOrderModalProps) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<OrderFormData>();

  const watchCantidad = watch('cantidad');
  const watchPrecio = watch('precio');

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Poblar formulario cuando se cargan los datos
  useEffect(() => {
    if (isOpen && order && clients.length > 0 && products.length > 0) {
      populateForm();
    }
  }, [isOpen, order, clients, products]);

  // Calcular total automáticamente
  useEffect(() => {
    if (watchCantidad && watchPrecio) {
      const total = parseFloat(watchCantidad.toString()) * parseFloat(watchPrecio.toString());
      setCalculatedTotal(total);
    } else {
      setCalculatedTotal(0);
    }
  }, [watchCantidad, watchPrecio]);

  const loadInitialData = async () => {
    try {
      const [clientsRes, productsRes] = await Promise.all([
        ordersService.getClients(),
        ordersService.getProducts()
      ]);

      if (clientsRes.data) {
        setClients(clientsRes.data);
      }

      if (productsRes.data) {
        setProducts(productsRes.data);
      }
    } catch (err: any) {
      error('Error al cargar los datos', err.message || 'Error desconocido');
    }
  };

  const populateForm = () => {
    if (!order) return;

    // Convertir fecha para el input date (formato YYYY-MM-DD) sin conversión de zona horaria
    const fechaFormatted = dateToInputValue(order.fecha);
    
    // Obtener IDs de cliente y producto (manejar tanto objetos populados como strings)
    let clienteId: string;
    let productoId: string;
    
    if (typeof order.cliente === 'string') {
      clienteId = order.cliente;
    } else {
      // El objeto puede tener _id o id
      clienteId = (order.cliente as any)._id || order.cliente.id;
    }
    
    if (typeof order.producto === 'string') {
      productoId = order.producto;
    } else {
      // El objeto puede tener _id o id
      productoId = (order.producto as any)._id || order.producto.id;
    }
    
    // Establecer valores en el formulario
    setValue('fecha', fechaFormatted as any);
    setValue('cliente', clienteId);
    setValue('producto', productoId);
    setValue('lote', order.lote);
    setValue('cantidad', order.cantidad);
    setValue('precio', order.precio);
    setValue('estado', order.estado);

    // Establecer total inicial
    setCalculatedTotal(order.total);
  };

  const handleClose = () => {
    reset();
    setCalculatedTotal(0);
    onClose();
  };

  const onSubmit = async (data: OrderFormData) => {
    if (!order) return;

    try {
      setLoading(true);

      // Validar que se hayan seleccionado cliente y producto
      if (!data.cliente) {
        error('Debe seleccionar un cliente');
        return;
      }

      if (!data.producto) {
        error('Debe seleccionar un producto');
        return;
      }

      // Calcular total
      const cantidad = parseFloat(data.cantidad.toString());
      const precio = parseFloat(data.precio.toString());
      const total = cantidad * precio;

      // Convertir fecha string (YYYY-MM-DD) a Date UTC
      const fechaDate = typeof data.fecha === 'string' 
        ? new Date(data.fecha + 'T00:00:00.000Z')
        : data.fecha;

      // Preparar datos para envío
      const orderData = {
        ...data,
        fecha: fechaDate,
        cantidad: cantidad,
        precio: precio,
        total: total
      };

      await ordersService.updateOrder(order.id, orderData);
      
      success('Orden actualizada exitosamente');
      handleClose();
      onSuccess();
    } catch (err: any) {
      error(err.message || 'Error al actualizar la orden');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getClientName = (cliente: Client | string) => {
    if (typeof cliente === 'string') {
      const clientObj = clients.find(c => c.id === cliente);
      return clientObj ? `${clientObj.nombre} ${clientObj.apellido}` : 'Cliente no encontrado';
    }
    // Manejar tanto _id como id
    const clientId = (cliente as any)._id || cliente.id;
    if (clientId) {
      const clientObj = clients.find(c => c.id === clientId);
      if (clientObj) {
        return `${clientObj.nombre} ${clientObj.apellido}`;
      }
    }
    return `${cliente.nombre} ${cliente.apellido}`;
  };

  const getProductName = (producto: Product | string) => {
    if (typeof producto === 'string') {
      const productObj = products.find(p => p.id === producto);
      return productObj ? productObj.nombre : 'Producto no encontrado';
    }
    // Manejar tanto _id como id
    const productId = (producto as any)._id || producto.id;
    if (productId) {
      const productObj = products.find(p => p.id === productId);
      if (productObj) {
        return productObj.nombre;
      }
    }
    return producto.nombre;
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Editar Orden - ${order.lote}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información actual de la orden */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Información Actual:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Cliente:</span> {getClientName(order.cliente)}
            </div>
            <div>
              <span className="text-gray-600">Producto:</span> {getProductName(order.producto)}
            </div>
            <div>
              <span className="text-gray-600">Total Original:</span> {formatCurrency(order.total)}
            </div>
            <div>
              <span className="text-gray-600">Estado Actual:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                order.estado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                order.estado === 'POR PAGAR' ? 'bg-yellow-100 text-yellow-800' :
                order.estado === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.estado}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <div className="relative">
              <Input
                type="date"
                {...register('fecha', { 
                  required: 'La fecha es obligatoria' 
                })}
                className="pl-10"
              />
              <CalendarDays className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            {errors.fecha && (
              <p className="mt-1 text-sm text-red-600">{errors.fecha.message}</p>
            )}
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <Select
              {...register('cliente', { 
                required: 'Debe seleccionar un cliente' 
              })}
            >
              <option value="">Seleccionar cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nombre} {client.apellido}
                  {client.empresa && ` - ${client.empresa}`}
                </option>
              ))}
            </Select>
            {errors.cliente && (
              <p className="mt-1 text-sm text-red-600">{errors.cliente.message}</p>
            )}
          </div>

          {/* Producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto *
            </label>
            <Select
              {...register('producto', { 
                required: 'Debe seleccionar un producto' 
              })}
            >
              <option value="">Seleccionar producto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nombre}
                  {product.categoria && ` - ${product.categoria}`}
                  {product.precio && ` (${formatCurrency(product.precio)})`}
                </option>
              ))}
            </Select>
            {errors.producto && (
              <p className="mt-1 text-sm text-red-600">{errors.producto.message}</p>
            )}
          </div>

          {/* Lote */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lote *
            </label>
            <Input
              type="text"
              placeholder="Número de lote"
              {...register('lote', { 
                required: 'El lote es obligatorio',
                minLength: {
                  value: 2,
                  message: 'El lote debe tener al menos 2 caracteres'
                }
              })}
            />
            {errors.lote && (
              <p className="mt-1 text-sm text-red-600">{errors.lote.message}</p>
            )}
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad *
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              {...register('cantidad', { 
                required: 'La cantidad es obligatoria',
                min: {
                  value: 0.01,
                  message: 'La cantidad debe ser mayor a 0'
                }
              })}
            />
            {errors.cantidad && (
              <p className="mt-1 text-sm text-red-600">{errors.cantidad.message}</p>
            )}
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Unitario *
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              {...register('precio', { 
                required: 'El precio es obligatorio',
                min: {
                  value: 0.01,
                  message: 'El precio debe ser mayor a 0'
                }
              })}
            />
            {errors.precio && (
              <p className="mt-1 text-sm text-red-600">{errors.precio.message}</p>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado *
            </label>
            <Select
              {...register('estado', { 
                required: 'Debe seleccionar un estado' 
              })}
            >
              <option value="POR PAGAR">Por Pagar</option>
              <option value="PAGADO">Pagado</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="ENTREGADO">Entregado</option>
            </Select>
            {errors.estado && (
              <p className="mt-1 text-sm text-red-600">{errors.estado.message}</p>
            )}
          </div>

          {/* Nuevo Total Calculado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuevo Total
            </label>
            <div className="mt-1 p-3 bg-blue-50 border border-blue-300 rounded-md">
              <span className="text-lg font-semibold text-blue-900">
                {formatCurrency(calculatedTotal)}
              </span>
              {calculatedTotal !== order.total && (
                <div className="text-xs text-blue-600 mt-1">
                  Cambio: {formatCurrency(calculatedTotal - order.total)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
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
            Actualizar Orden
          </Button>
        </div>
      </form>
    </Modal>
  );
}