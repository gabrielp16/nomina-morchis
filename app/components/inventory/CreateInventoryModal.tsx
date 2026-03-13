import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { addMonths, buildDefaultLotNumber, formatDateDash } from '../../lib/inventory';
import { inventoryService, productService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { InventoryFormData, Product } from '../../types/auth';

const lotNumberRegex = /^\d{8}-[A-Za-z0-9]{6}$/;

const createInventorySchema = z.object({
  product: z.string().min(1, 'Debe seleccionar un producto'),
  quantity: z.number().int('La cantidad debe ser entera').min(1, 'La cantidad debe ser mayor a 0'),
  lotNumber: z.string().trim().regex(lotNumberRegex, 'El lote debe tener formato YYYYMMDD-TTTTNN'),
  expirationDate: z.string().min(1, 'Debe seleccionar una fecha de vencimiento')
});

type CreateInventoryFormValues = z.infer<typeof createInventorySchema>;

interface CreateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInventoryModal({ isOpen, onClose, onSuccess }: CreateInventoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
    reset
  } = useForm<CreateInventoryFormValues>({
    resolver: zodResolver(createInventorySchema),
    defaultValues: {
      product: '',
      quantity: 1,
      lotNumber: '',
      expirationDate: ''
    }
  });

  const selectedProductId = watch('product');

  useEffect(() => {
    if (isOpen) {
      reset({
        product: '',
        quantity: 1,
        lotNumber: '',
        expirationDate: ''
      });
      setError(null);
      loadProducts();
    }
  }, [isOpen, reset]);

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === selectedProductId);
  }, [products, selectedProductId]);

  useEffect(() => {
    if (!selectedProduct) return;

    const now = new Date();
    const currentLot = getValues('lotNumber');
    const currentProductionCode = currentLot.match(/([A-Za-z0-9]{2})$/)?.[1] || '01';

    setValue('lotNumber', buildDefaultLotNumber(now, selectedProduct.productCode, currentProductionCode), {
      shouldValidate: true
    });
    setValue('expirationDate', formatDateDash(addMonths(now, 6)), { shouldValidate: true });
  }, [selectedProduct, getValues, setValue]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await productService.getAll(1, 1000);
      if (response.success && response.data) {
        setProducts((response.data.data || []).filter((product) => product.active));
      }
    } catch (err) {
      console.error('Error loading products for inventory:', err);
      showError('Error al cargar productos');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const onSubmit = async (values: CreateInventoryFormValues) => {
    setIsLoading(true);
    setError(null);

    const selectedProd = products.find((p) => p.id === values.product);
    if (selectedProd) {
      const lotProductCode = values.lotNumber.substring(9, 13);
      if (lotProductCode.toUpperCase() !== selectedProd.productCode.toUpperCase()) {
        const message = `El codigo de producto en el lote (${lotProductCode}) no coincide con el codigo del producto seleccionado (${selectedProd.productCode})`;
        setError(message);
        showError(message);
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload: InventoryFormData = {
        product: values.product,
        quantity: values.quantity,
        lotNumber: values.lotNumber,
        expirationDate: values.expirationDate.replace(/-/g, '/')
      };

      const response = await inventoryService.create(payload);

      if (response.success) {
        success('Registro de inventario creado exitosamente');
        onSuccess();
        onClose();
      } else {
        const message = response.error || 'Error al crear registro de inventario';
        setError(message);
        showError(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLotNumberChange = (value: string) => {
    setValue('lotNumber', value.toUpperCase(), { shouldValidate: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className={cn(
            'fixed inset-0 bg-black/50 z-40 transition-opacity opacity-100 flex items-center justify-center p-4 z-50',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
        />

        <div className="relative inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-50">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Nuevo Registro de Inventario</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="inventory-product" className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <select
                  id="inventory-product"
                  {...register('product')}
                  className={cn(
                    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                    errors.product && 'border-red-300'
                  )}
                  disabled={isLoadingProducts}
                >
                  <option value="">Seleccionar producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.productCode})
                    </option>
                  ))}
                </select>
                {errors.product && <p className="mt-1 text-sm text-red-600">{errors.product.message}</p>}
              </div>

              <div>
                <label htmlFor="inventory-quantity" className="block text-sm font-medium text-gray-700 mb-1">Cantidad (Unidad(es)) *</label>
                <Input
                  id="inventory-quantity"
                  type="number"
                  min={1}
                  step={1}
                  {...register('quantity', { valueAsNumber: true })}
                  className={cn(errors.quantity && 'border-red-300')}
                />
                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
              </div>

              <div>
                <label htmlFor="inventory-expiration" className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento *</label>
                <Input
                  id="inventory-expiration"
                  type="date"
                  {...register('expirationDate')}
                  className={cn(errors.expirationDate && 'border-red-300')}
                />
                {errors.expirationDate && <p className="mt-1 text-sm text-red-600">{errors.expirationDate.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="inventory-lot-number" className="block text-sm font-medium text-gray-700 mb-1">Lote *</label>
                <Input
                  id="inventory-lot-number"
                  type="text"
                  placeholder="YYYYMMDD-TTTTNN"
                  value={watch('lotNumber') || ''}
                  onChange={(event) => handleLotNumberChange(event.target.value)}
                  className={cn(errors.lotNumber && 'border-red-300')}
                />
                <p className="mt-1 text-xs text-gray-500">Formato: YYYYMMDD-TTTTNN. Ejemplo: 20260325-GOWP01</p>
                {errors.lotNumber && <p className="mt-1 text-sm text-red-600">{errors.lotNumber.message}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} className="inline-flex items-center">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
