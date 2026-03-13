import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { productService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Product } from '../../types/auth';

const editProductSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Maximo 100 caracteres'),
  productCode: z.string().trim().regex(/^[A-Za-z0-9]{4}$/, 'Debe tener 4 caracteres (letras o numeros) (TTTT)'),
  description: z.string().trim().min(1, 'La descripcion es obligatoria').max(256, 'Maximo 256 caracteres'),
  active: z.boolean(),
  price: z.union([
    z.number().min(0, 'El precio no puede ser negativo'),
    z.null()
  ])
});

type EditProductFormValues = z.infer<typeof editProductSchema>;

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product;
}

export function EditProductModal({ isOpen, onClose, onSuccess, product }: EditProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const defaultValues = useMemo<EditProductFormValues>(() => ({
    name: product.name,
    productCode: product.productCode || '',
    description: product.description,
    active: product.active,
    price: product.price ?? null
  }), [product]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
    defaultValues
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
      setError(null);
    }
  }, [isOpen, defaultValues, reset]);

  const priceValue = watch('price');

  const onSubmit = async (values: EditProductFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productService.update(product.id, {
        name: values.name,
        productCode: values.productCode,
        description: values.description,
        active: values.active,
        price: values.price
      });

      if (response.success) {
        success('Producto actualizado exitosamente');
        onSuccess();
        onClose();
      } else {
        const message = response.error || 'Error al actualizar producto';
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

  const handlePriceChange = (value: string) => {
    if (!value.trim()) {
      setValue('price', null, { shouldValidate: true });
      return;
    }

    const parsed = Number(value);
    setValue('price', Number.isNaN(parsed) ? null : parsed, { shouldValidate: true });
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
            <h3 className="text-lg font-medium text-gray-900">Editar Producto</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <Input
                  id="product-name"
                  {...register('name')}
                  maxLength={100}
                  className={cn(errors.name && 'border-red-300')}
                />
                <p className="mt-1 text-xs text-gray-500">Maximo 100 caracteres</p>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="product-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Codigo Producto *
                </label>
                <Input
                  id="product-code"
                  {...register('productCode')}
                  maxLength={4}
                  placeholder="TTTT"
                  className={cn(errors.productCode && 'border-red-300')}
                />
                <p className="mt-1 text-xs text-gray-500">Identificador de 4 caracteres (letras o numeros) del tipo de producto</p>
                {errors.productCode && <p className="mt-1 text-sm text-red-600">{errors.productCode.message}</p>}
              </div>

              <div>
                <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripcion *
                </label>
                <textarea
                  id="product-description"
                  {...register('description')}
                  maxLength={256}
                  rows={4}
                  className={cn(
                    'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
                    errors.description && 'border-red-300'
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">Maximo 256 caracteres</p>
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div>
                <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio (COP, opcional)
                </label>
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  step="1"
                  value={priceValue ?? ''}
                  onChange={(event) => handlePriceChange(event.target.value)}
                  placeholder="Ej. 25000"
                  className={cn(errors.price && 'border-red-300')}
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
              </div>

              <div className="flex items-center">
                <input
                  id="product-active"
                  type="checkbox"
                  checked={watch('active')}
                  onChange={(event) => setValue('active', event.target.checked, { shouldValidate: true })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="product-active" className="ml-2 text-sm text-gray-700">
                  Activo
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
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
