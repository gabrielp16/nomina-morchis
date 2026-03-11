import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { clientService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Client, ClientFormData } from '../../types/auth';

const editClientSchema = z.object({
  name: z.string().trim().min(1, 'La razon social es obligatoria').max(100, 'Maximo 100 caracteres'),
  type: z.enum(['Persona Natural', 'Persona Juridica']),
  documentNumber: z.string().trim().min(1, 'El NIT es obligatorio').max(20, 'Maximo 20 caracteres'),
  address: z.string().trim().min(1, 'La direccion es obligatoria').max(256, 'Maximo 256 caracteres'),
  city: z.string().trim().min(1, 'La ciudad es obligatoria').max(50, 'Maximo 50 caracteres'),
  phone: z.string().trim().min(1, 'El telefono es obligatorio').max(10, 'Maximo 10 caracteres'),
  email: z.string().trim().email('Correo invalido').max(70, 'Maximo 70 caracteres'),
  active: z.boolean()
});

type EditClientFormValues = z.infer<typeof editClientSchema>;

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: Client;
}

export function EditClientModal({ isOpen, onClose, onSuccess, client }: EditClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const defaultValues = useMemo<EditClientFormValues>(() => ({
    name: client.name,
    type: client.type,
    documentNumber: client.documentNumber,
    address: client.address,
    city: client.city,
    phone: client.phone,
    email: client.email,
    active: client.active
  }), [client]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
      setError(null);
    }
  }, [isOpen, defaultValues, reset]);

  const onSubmit = async (values: EditClientFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload: ClientFormData = {
        name: values.name,
        type: values.type,
        documentNumber: values.documentNumber,
        address: values.address,
        city: values.city,
        phone: values.phone,
        email: values.email,
        active: values.active
      };

      const response = await clientService.update(client.id, payload);

      if (response.success) {
        success('Cliente actualizado exitosamente');
        onSuccess();
        onClose();
      } else {
        const message = response.error || 'Error al actualizar cliente';
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
            <h3 className="text-lg font-medium text-gray-900">Editar Cliente</h3>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">Razon social *</label>
                <Input id="client-name" {...register('name')} maxLength={100} className={cn(errors.name && 'border-red-300')} />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="client-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  id="client-type"
                  {...register('type')}
                  className={cn(
                    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                    errors.type && 'border-red-300'
                  )}
                >
                  <option value="Persona Natural">Persona Natural</option>
                  <option value="Persona Juridica">Persona Juridica</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
              </div>

              <div>
                <label htmlFor="client-document-number" className="block text-sm font-medium text-gray-700 mb-1">NIT *</label>
                <Input id="client-document-number" {...register('documentNumber')} maxLength={20} className={cn(errors.documentNumber && 'border-red-300')} />
                {errors.documentNumber && <p className="mt-1 text-sm text-red-600">{errors.documentNumber.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="client-address" className="block text-sm font-medium text-gray-700 mb-1">Direccion *</label>
                <Input id="client-address" {...register('address')} maxLength={256} className={cn(errors.address && 'border-red-300')} />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
              </div>

              <div>
                <label htmlFor="client-city" className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                <Input id="client-city" {...register('city')} maxLength={50} className={cn(errors.city && 'border-red-300')} />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
              </div>

              <div>
                <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefono *</label>
                <Input id="client-phone" {...register('phone')} maxLength={10} className={cn(errors.phone && 'border-red-300')} />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input id="client-email" type="email" {...register('email')} maxLength={70} className={cn(errors.email && 'border-red-300')} />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div className="md:col-span-2 flex items-center">
                <input
                  id="client-active"
                  type="checkbox"
                  checked={watch('active')}
                  onChange={(event) => setValue('active', event.target.checked, { shouldValidate: true })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="client-active" className="ml-2 text-sm text-gray-700">Activo</label>
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
