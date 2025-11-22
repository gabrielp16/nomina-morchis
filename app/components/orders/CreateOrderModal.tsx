import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarDays } from 'lucide-react';
import Modal from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/utils';
import ordersService from '../../services/ordersService';
import type { CreateOrderFormData, Client, Product } from '../../types/auth';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOrderModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateOrderModalProps) {
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
  } = useForm<CreateOrderFormData>({
    defaultValues: {
      fecha: new Date(),
      estado: 'POR PAGAR'
    }
  });

  const watchCantidad = watch('cantidad');
  const watchPrecio = watch('precio');
  const watchProducto = watch('producto');

  // Cargar clientes y productos
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Prepoblar precio cuando se selecciona un producto
  useEffect(() => {
    if (watchProducto && products.length > 0) {
      const selectedProduct = products.find(p => p.id === watchProducto);
      if (selectedProduct && selectedProduct.precio !== undefined && selectedProduct.precio !== null) {
        setValue('precio', selectedProduct.precio);
      }
    }
  }, [watchProducto, products, setValue]);

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
    } catch (error: any) {
      error(error.message || 'Error al cargar los datos', 'error');
    }
  };

  const handleClose = () => {
    reset();
    setCalculatedTotal(0);
    onClose();
  };

  const onSubmit = async (data: CreateOrderFormData) => {
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

      await ordersService.createOrder(orderData);
      
      success('Orden creada exitosamente');
      handleClose();
      onSuccess();
    } catch (error: any) {
      error(error.message || 'Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Nueva Orden"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Total Calculado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Calculado
            </label>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(calculatedTotal)}
              </span>
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
            Crear Orden
          </Button>
        </div>
      </form>
    </Modal>
  );
}