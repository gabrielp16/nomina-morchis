import type { 
  Order, 
  Client, 
  Product, 
  OrderFormData, 
  CreateOrderFormData, 
  OrderFilters, 
  OrderStats,
  ApiResponse, 
  PaginatedResponse 
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const config: RequestInit = {
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': window?.location?.origin || 'https://nomina-morchis.vercel.app',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 204) {
      return {
        success: true,
        data: null as T,
        message: 'Operación exitosa'
      };
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', data);
      throw new Error(data.message || data.error || `Error HTTP: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Fetch Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error de conexión');
  }
}

export const ordersService = {
  getOrders: async (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      if (filters.fechaInicio) searchParams.append('fechaDesde', filters.fechaInicio.toISOString());
      if (filters.fechaFin) searchParams.append('fechaHasta', filters.fechaFin.toISOString());
      if (filters.cliente) searchParams.append('cliente', filters.cliente);
      if (filters.producto) searchParams.append('producto', filters.producto);
      if (filters.lote) searchParams.append('lote', filters.lote);
      if (filters.estado) searchParams.append('estado', filters.estado);
      if (filters.page) searchParams.append('page', filters.page.toString());
      if (filters.limit) searchParams.append('limit', filters.limit.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchApi<{
      success: boolean;
      data: Order[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      message: string;
    }>(endpoint);
    
    // fetchApi devuelve la respuesta completa del backend
    return {
      data: response.data,
      pagination: {
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.total,
        itemsPerPage: response.pagination.limit
      }
    };
  },

  getOrderById: async (id: string): Promise<ApiResponse<Order>> => {
    return await fetchApi<Order>(`/orders/${id}`);
  },

  createOrder: async (orderData: CreateOrderFormData): Promise<ApiResponse<Order>> => {
    return await fetchApi<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  updateOrder: async (id: string, orderData: Partial<OrderFormData>): Promise<ApiResponse<Order>> => {
    return await fetchApi<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  deleteOrder: async (id: string): Promise<ApiResponse<void>> => {
    return await fetchApi<void>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  getOrderStats: async (): Promise<ApiResponse<OrderStats>> => {
    return await fetchApi<OrderStats>('/orders/stats/summary');
  },

  getClients: async (): Promise<ApiResponse<Client[]>> => {
    const response = await fetchApi<any>('/clients');
    const normalizedData = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return {
      ...response,
      data: normalizedData
    };
  },

  createClient: async (clientData: Omit<Client, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<ApiResponse<Client>> => {
    return await fetchApi<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  },

  updateClient: async (id: string, clientData: Partial<Omit<Client, 'id' | 'fechaCreacion' | 'fechaActualizacion'>>): Promise<ApiResponse<Client>> => {
    return await fetchApi<Client>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  },

  deleteClient: async (id: string): Promise<ApiResponse<void>> => {
    return await fetchApi<void>(`/clients/${id}`, {
      method: 'DELETE',
    });
  },

  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await fetchApi<any>('/products');
    const normalizedData = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return {
      ...response,
      data: normalizedData
    };
  },

  createProduct: async (productData: Omit<Product, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<ApiResponse<Product>> => {
    return await fetchApi<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (id: string, productData: Partial<Omit<Product, 'id' | 'fechaCreacion' | 'fechaActualizacion'>>): Promise<ApiResponse<Product>> => {
    return await fetchApi<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  deleteProduct: async (id: string): Promise<ApiResponse<void>> => {
    return await fetchApi<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }
};

export default ordersService;