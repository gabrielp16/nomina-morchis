import api from './api';
import type { ProductPrice, ProductPriceFormData } from '../types/auth';

interface ProductPriceResponse {
  success: boolean;
  data: ProductPrice | ProductPrice[];
  total?: number;
  message?: string;
}

interface ProductWithPricesResponse {
  success: boolean;
  data: {
    producto: {
      _id: string;
      nombre: string;
      unidad: string;
      descripcion?: string;
    };
    preciosPorCliente: Array<{
      cliente: string;
      valor: number;
      id_producto: string;
      producto: string;
      clienteId: string;
      nit?: string;
      precioId: string;
    }>;
  };
}

interface ClientPricesResponse {
  success: boolean;
  data: {
    cliente: {
      _id: string;
      nombre: string;
      nit?: string;
    };
    precios: Array<{
      _id: string;
      producto: string;
      productoId: string;
      unidad: string;
      precio: number;
      createdAt: Date;
    }>;
  };
}

const productPriceService = {
  /**
   * Obtener todos los precios (con filtros opcionales)
   */
  async getAll(filters?: {
    producto?: string;
    cliente?: string;
    activo?: boolean;
  }): Promise<ProductPriceResponse> {
    const params = new URLSearchParams();
    if (filters?.producto) params.append('producto', filters.producto);
    if (filters?.cliente) params.append('cliente', filters.cliente);
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));

    const queryString = params.toString();
    const url = queryString ? `/product-prices?${queryString}` : '/product-prices';
    
    const response = await api.get<ProductPriceResponse>(url);
    return response.data;
  },

  /**
   * Obtener precios por producto con información de clientes
   */
  async getByProduct(productoId: string): Promise<ProductWithPricesResponse> {
    const response = await api.get<ProductWithPricesResponse>(
      `/product-prices/producto/${productoId}`
    );
    return response.data;
  },

  /**
   * Obtener precios por cliente
   */
  async getByClient(clienteId: string): Promise<ClientPricesResponse> {
    const response = await api.get<ClientPricesResponse>(
      `/product-prices/cliente/${clienteId}`
    );
    return response.data;
  },

  /**
   * Obtener precio específico para un cliente-producto
   */
  async getPrice(productoId: string, clienteId: string): Promise<number | null> {
    try {
      const response = await this.getAll({
        producto: productoId,
        cliente: clienteId,
        activo: true
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0].precio;
      }

      return null;
    } catch (error) {
      console.error('Error al obtener precio:', error);
      return null;
    }
  },

  /**
   * Crear nuevo precio
   */
  async create(data: ProductPriceFormData): Promise<ProductPriceResponse> {
    const response = await api.post<ProductPriceResponse>('/product-prices', data);
    return response.data;
  },

  /**
   * Actualizar precio existente
   */
  async update(id: string, precio: number): Promise<ProductPriceResponse> {
    const response = await api.put<ProductPriceResponse>(
      `/product-prices/${id}`,
      { precio }
    );
    return response.data;
  },

  /**
   * Desactivar precio (soft delete)
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/product-prices/${id}`
    );
    return data;
  }
};

export default productPriceService;
